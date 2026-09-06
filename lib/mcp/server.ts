/**
 * The MCP protocol core and server side, built by hand with no MCP SDK -
 * plain objects shaped like JSON-RPC, passed directly between our own
 * classes (no real socket/HTTP/stdio transport - this is a single Vercel
 * Node function, same "two objects calling each other's methods" scope as
 * SkyVault's Python mcp_server.py).
 *
 * MCPServer speaks exactly three methods (initialize, tools/list,
 * tools/call) and delegates every one of them to a ToolRegistry. It knows
 * nothing about *how* a tool works internally - only that the registry can
 * run it, and that a bad request needs a correctly-shaped error object
 * back, not a crash.
 */

import type { ToolRegistry } from "./registry";

export const PROTOCOL_VERSION = "2024-11-05";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

/** Raised internally when a request can't be fulfilled at the protocol
 * level (unknown method, unknown tool, missing argument) - distinct from a
 * tool's own domain-level failure (e.g. system unreachable), which still
 * rides back inside a normal "result", exactly as SkyVault's
 * {"status": "error", ...} shape did. */
class ProtocolError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

export class MCPServer {
  constructor(
    private registry: ToolRegistry,
    private serverName = "ITHelpdeskCopilotMCPServer",
    private serverVersion = "1.0.0",
  ) {}

  handleRequest(request: JsonRpcRequest): JsonRpcResponse {
    const { id, method, params = {} } = request;

    try {
      let result: unknown;
      if (method === "initialize") {
        result = this.initialize(params);
      } else if (method === "tools/list") {
        result = this.toolsList();
      } else if (method === "tools/call") {
        result = this.toolsCall(params);
      } else {
        throw new ProtocolError(-32601, `Method not found: ${method}`);
      }
      return { jsonrpc: "2.0", id, result };
    } catch (exc) {
      if (exc instanceof ProtocolError) {
        return { jsonrpc: "2.0", id, error: { code: exc.code, message: exc.message } };
      }
      throw exc;
    }
  }

  private initialize(params: Record<string, unknown>) {
    const clientInfo = (params.clientInfo ?? {}) as { name?: string };
    return {
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: { name: this.serverName, version: this.serverVersion },
      capabilities: { tools: {} },
      clientAcknowledged: clientInfo.name ?? null,
    };
  }

  private toolsList() {
    return { tools: this.registry.listTools() };
  }

  private toolsCall(params: Record<string, unknown>) {
    const name = params.name as string | undefined;
    const args = (params.arguments ?? {}) as Record<string, unknown>;

    if (!name || !this.registry.hasTool(name)) {
      throw new ProtocolError(-32001, `Unknown tool: ${name}`);
    }

    const missing = this.registry.requiredParams(name).filter((p) => !(p in args));
    if (missing.length > 0) {
      throw new ProtocolError(
        -32602,
        `Missing required argument(s) for '${name}': ${missing.join(", ")}`,
      );
    }

    try {
      return this.registry.call(name, args);
    } catch (exc) {
      throw new ProtocolError(-32602, `Invalid arguments for '${name}': ${String(exc)}`);
    }
  }
}
