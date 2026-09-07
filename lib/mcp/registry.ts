/**
 * The Tool Registry: wraps every real function (the six from
 * lib/agent/tools.ts, plus remember/recall from lib/agent/memory.ts) with
 * the name/description/schema metadata needed to describe it to a caller.
 * Knows nothing about JSON-RPC, tools/list, or the model. Just "here is
 * what I can run, and how to describe it." Direct TypeScript equivalent of
 * SkyVault's mcp_server.py ToolRegistry.
 */

import type { ToolSchema } from "@/lib/agent/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolFn = (args: Record<string, any>) => Record<string, unknown>;

interface RegisteredTool {
  fn: ToolFn;
  description: string;
  inputSchema: ToolSchema["input_schema"];
}

export interface MCPToolListing {
  name: string;
  description: string;
  inputSchema: ToolSchema["input_schema"];
}

export class ToolRegistry {
  private tools = new Map<string, RegisteredTool>();

  register(name: string, fn: ToolFn, description: string, inputSchema: ToolSchema["input_schema"]) {
    this.tools.set(name, { fn, description, inputSchema });
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /** MCP's tools/list shape uses "inputSchema" (camelCase). Not
   * Anthropic's "input_schema". This is the one place that translation
   * happens on the server side; the agent loop translates it back on the
   * client/Host side when building the model's `tools` parameter. */
  listTools(): MCPToolListing[] {
    return Array.from(this.tools.entries()).map(([name, t]) => ({
      name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  requiredParams(name: string): string[] {
    return this.tools.get(name)?.inputSchema.required ?? [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call(name: string, args: Record<string, any>): Record<string, unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`call() invoked for unregistered tool '${name}'`);
    return tool.fn(args);
  }
}
