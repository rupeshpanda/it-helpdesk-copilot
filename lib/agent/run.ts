/**
 * The function-calling lifecycle and multi-tool loop, mediated entirely by
 * MCP. Direct TypeScript equivalent of SkyVault's agent.py run_agent().
 *
 *   Ask -> Tool request -> MCPClient.callTool() -> Return result -> Model answers
 *
 * This file is the MCP Host: it owns the model and decides when a tool is
 * needed, but it never touches tools.ts or memory.ts directly. The
 * MCPClient does that, by talking to an MCPServer built in registry.ts.
 */

import Anthropic from "@anthropic-ai/sdk";
import { MCPClient } from "@/lib/mcp/client";
import type { MCPToolListing } from "@/lib/mcp/registry";
import { MCPServer } from "@/lib/mcp/server";
import { buildContextSummary, type MemoryOp, type MemoryStore } from "./memory";
import { buildRegistryForRequest } from "./registry";
import { SYSTEM_PROMPT } from "./schemas";

const MODEL = process.env.HELPDESK_MODEL ?? "claude-sonnet-4-5-20250929";
const MAX_ITERATIONS = 8;
const MAX_TOKENS = 1024;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface TraceStep {
  tool: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface RunResult {
  reply: string;
  trace: TraceStep[];
  mcpLog: MCPClient["log"];
  memoryOps: MemoryOp[];
}

/** Bridges the one difference between MCP's tools/list shape
 * ({name, description, inputSchema}) and what Anthropic's `tools`
 * parameter expects ({name, description, input_schema}). Same JSON
 * Schema underneath, different key name. The only place in the whole
 * project this translation happens. */
function mcpToolsToAnthropicSchema(mcpTools: MCPToolListing[]): Anthropic.Tool[] {
  return mcpTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as unknown as Anthropic.Tool.InputSchema,
  }));
}

export async function runAgent(
  history: ChatTurn[],
  memory: MemoryStore,
  apiKey: string,
): Promise<RunResult> {
  const client = new Anthropic({ apiKey });
  const { registry, memoryOps } = buildRegistryForRequest(memory);
  const mcpClient = new MCPClient(new MCPServer(registry));

  const toolSchemas = mcpToolsToAnthropicSchema(mcpClient.listTools());

  const memorySummary = buildContextSummary(memory);
  const systemPrompt = `${SYSTEM_PROMPT}\n\n${memorySummary}`;

  const messages: Anthropic.MessageParam[] = history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));
  const trace: TraceStep[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: toolSchemas,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      const reply = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return { reply, trace, mcpLog: mcpClient.log, memoryOps };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const args = (block.input ?? {}) as Record<string, unknown>;
      const result = mcpClient.callTool(block.name, args);
      trace.push({ tool: block.name, arguments: args, result });

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    reply: "The Copilot could not reach a final answer within the tool-call limit.",
    trace,
    mcpLog: mcpClient.log,
    memoryOps,
  };
}
