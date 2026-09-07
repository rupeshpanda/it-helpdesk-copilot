/**
 * The MCP Client. The only thing the agent loop (lib/agent/run.ts, the
 * Host) is allowed to talk to. Formats requests as JSON-RPC, hands them to
 * an MCPServer, and unwraps the response. No real transport is used here
 * either (see server.ts). The message *shape* crossing the boundary is
 * identical to what a real networked deployment would send, which is the
 * point of building it by hand.
 */

import type { JsonRpcRequest, JsonRpcResponse, MCPServer } from "./server";
import type { MCPToolListing } from "./registry";

export type RpcLogEntry = { request: JsonRpcRequest; response: JsonRpcResponse };

export class MCPClient {
  private nextId = 1;
  private initialized = false;
  public log: RpcLogEntry[] = [];

  constructor(
    private server: MCPServer,
    private clientName = "ITHelpdeskCopilotAgent",
    private clientVersion = "1.0.0",
  ) {}

  private send(method: string, params: Record<string, unknown>): JsonRpcResponse {
    const request: JsonRpcRequest = { jsonrpc: "2.0", id: this.nextId++, method, params };
    const response = this.server.handleRequest(request);
    this.log.push({ request, response });
    return response;
  }

  initialize() {
    const response = this.send("initialize", {
      clientInfo: { name: this.clientName, version: this.clientVersion },
      protocolVersion: "2024-11-05",
    });
    if (response.error) throw new Error(`MCP initialize failed: ${response.error.message}`);
    this.initialized = true;
    return response.result;
  }

  listTools(): MCPToolListing[] {
    if (!this.initialized) this.initialize();
    const response = this.send("tools/list", {});
    if (response.error) throw new Error(`MCP tools/list failed: ${response.error.message}`);
    return (response.result as { tools: MCPToolListing[] }).tools;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callTool(name: string, args: Record<string, any>): Record<string, unknown> {
    if (!this.initialized) this.initialize();
    const response = this.send("tools/call", { name, arguments: args });
    if (response.error) {
      // Protocol-level failure (unknown tool / missing argument) surfaced
      // in the same {"status": "error", ...} shape a tool's own
      // domain-level failure already uses, so the agent loop needs exactly
      // one error-handling path, not two.
      return { status: "error", message: response.error.message };
    }
    return response.result as Record<string, unknown>;
  }
}
