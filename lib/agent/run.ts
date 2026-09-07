/**
 * The function-calling lifecycle and multi-tool loop, mediated entirely by
 * MCP. Direct TypeScript equivalent of SkyVault's agent.py run_agent().
 *
 *   Ask -> Tool request -> MCPClient.callTool() -> Return result -> Model answers
 *
 * This file is the MCP Host: it owns the model and decides when a tool is
 * needed, but it never touches tools.ts or memory.ts directly. The
 * MCPClient does that, by talking to an MCPServer built in registry.ts.
 *
 * It also holds the approval boundary. Read tools run on request. A tool
 * that changes something does not: the loop stops, hands the proposal back
 * to the caller, and runs nothing until a human answers. The model can only
 * ever ask.
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

/** Tools that change something. Everything else in this demo only reads. */
const WRITE_TOOLS = new Set(["escalate_ticket"]);

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface TraceStep {
  tool: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface PendingAction {
  tool: string;
  arguments: Record<string, unknown>;
  summary: string;
}

export interface RunResult {
  reply: string;
  trace: TraceStep[];
  mcpLog: MCPClient["log"];
  memoryOps: MemoryOp[];
  /** Set when the model asked to change something and the loop stopped. */
  pending?: PendingAction;
  /** The conversation as it stood when the loop stopped, so a decision can
   * resume it. Opaque to the client, handed straight back. */
  resumeState?: Anthropic.MessageParam[];
}

export interface Resume {
  state: Anthropic.MessageParam[];
  approved: boolean;
}

/** A plain sentence describing what the model is asking to do, shown to the
 * person deciding. Never derived from model text, only from the arguments. */
function summariseAction(tool: string, args: Record<string, unknown>): string {
  if (tool === "escalate_ticket") {
    return `Escalate ticket ${args.ticket_id} to ${args.team}.`;
  }
  return `Run ${tool}.`;
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

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export async function runAgent(
  history: ChatTurn[],
  memory: MemoryStore,
  apiKey: string,
  resume?: Resume,
): Promise<RunResult> {
  const client = new Anthropic({ apiKey });
  const { registry, memoryOps } = buildRegistryForRequest(memory);
  const mcpClient = new MCPClient(new MCPServer(registry));

  const toolSchemas = mcpToolsToAnthropicSchema(mcpClient.listTools());
  const systemPrompt = `${SYSTEM_PROMPT}\n\n${buildContextSummary(memory)}`;

  const messages: Anthropic.MessageParam[] = resume
    ? [...resume.state]
    : history.map((turn) => ({ role: turn.role, content: turn.content }));
  const trace: TraceStep[] = [];

  // Resuming: the last assistant turn is holding tool calls that were never
  // run. Run them now if the operator approved, and if not, tell the model
  // they were refused so it can say so rather than pretending they happened.
  if (resume) {
    const last = messages[messages.length - 1];
    const blocks = (Array.isArray(last?.content) ? last.content : []) as Anthropic.ContentBlock[];
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of blocks) {
      if (block.type !== "tool_use") continue;
      const args = (block.input ?? {}) as Record<string, unknown>;
      const result = resume.approved
        ? mcpClient.callTool(block.name, args)
        : {
            status: "declined",
            message: "The operator declined this action. Nothing was run.",
          };
      trace.push({ tool: block.name, arguments: args, result });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    if (toolResults.length > 0) {
      messages.push({ role: "user", content: toolResults });
    }
  }

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
      return { reply: textOf(response.content), trace, mcpLog: mcpClient.log, memoryOps };
    }

    // If anything in this batch changes something, stop here. Nothing in the
    // batch runs, including the read-only calls beside it, so the operator
    // sees one decision rather than a half-finished action.
    const write = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && WRITE_TOOLS.has(b.name),
    );
    if (write) {
      const args = (write.input ?? {}) as Record<string, unknown>;
      return {
        reply: textOf(response.content),
        trace,
        mcpLog: mcpClient.log,
        memoryOps,
        pending: { tool: write.name, arguments: args, summary: summariseAction(write.name, args) },
        resumeState: messages,
      };
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
