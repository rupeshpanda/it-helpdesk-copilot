"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { MemoryPanel } from "./MemoryPanel";
import { McpTracePanel } from "./McpTracePanel";
import { applyMemoryOps, loadMemory } from "@/lib/client/memoryStorage";
import type { TraceEntry } from "@/lib/client/describeRpc";
import type { ChatTurn, TraceStep } from "@/lib/agent/run";
import type { MemoryStore } from "@/lib/agent/memory";
import type { RpcLogEntry } from "@/lib/mcp/client";

const COPILOT = "Copilot agent";
const OTHER_TEAM = "Status bot";

interface ChatResponse {
  reply: string;
  trace: TraceStep[];
  mcpLog: RpcLogEntry[];
  error?: string;
}

interface OtherTeamResponse {
  consumer: string;
  toolsAvailable: number;
  result: { status: string; system?: string; systemStatus?: string; message?: string };
  mcpLog: RpcLogEntry[];
  error?: string;
}

/** A chat turn plus, for an assistant turn, the tool calls that produced it -
 * shown as inline annotations so the reasoning is visible without opening
 * the MCP trace panel. The extra `toolCalls` field is display-only: the API
 * route reads only `role`/`content` off each history entry, so carrying it
 * along in the request body is harmless. */
type DisplayMessage = ChatTurn & { toolCalls?: TraceStep[] };

export function HelpdeskDemo() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [memory, setMemory] = useState<MemoryStore>({});
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherTeamBusy, setOtherTeamBusy] = useState(false);
  const [otherTeamResult, setOtherTeamResult] = useState<string | null>(null);

  // Memory is loaded from localStorage only after mount - reading it during
  // server rendering would either throw (no `window`) or silently diverge
  // from what the browser actually has.
  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  async function handleSend(text: string) {
    setError(null);
    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, memory }),
      });
      const data = (await res.json()) as ChatResponse & { memoryOps?: Parameters<typeof applyMemoryOps>[0] };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Each chat turn replaces the trace: it is "what happened for this
      // answer", not a running log. The other team's bot appends to it.
      setTrace((data.mcpLog ?? []).map((e) => ({ ...e, consumer: COPILOT })));
      setOtherTeamResult(null);
      if (data.memoryOps && data.memoryOps.length > 0) {
        setMemory(applyMemoryOps(data.memoryOps));
      }
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply, toolCalls: data.trace ?? [] },
      ]);
    } catch {
      setError("Could not reach the Copilot. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAskOtherTeam() {
    setOtherTeamBusy(true);
    setOtherTeamResult(null);
    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/other-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: "SAP S/4HANA" }),
      });
      const data = (await res.json()) as OtherTeamResponse;
      if (!res.ok) {
        setOtherTeamResult(data.error ?? "The bot could not reach the tool server.");
        return;
      }
      setTrace((prev) => [...prev, ...(data.mcpLog ?? []).map((e) => ({ ...e, consumer: OTHER_TEAM }))]);
      const r = data.result;
      setOtherTeamResult(
        r.status === "ok"
          ? `Status bot, no model involved: ${r.system} is ${r.systemStatus}. Same server, ${data.toolsAvailable} tools on offer.`
          : `Status bot: ${r.message ?? "the tool reported an error"}.`,
      );
    } catch {
      setOtherTeamResult("Could not reach the tool server. Try again in a moment.");
    } finally {
      setOtherTeamBusy(false);
    }
  }

  function handleNewSession() {
    setMessages([]);
    setTrace([]);
    setOtherTeamResult(null);
    setError(null);
    // Deliberately NOT clearing memory - that persistence across a "new
    // session" is the entire point of this demo.
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <ChatPanel
        messages={messages}
        onSend={handleSend}
        onNewSession={handleNewSession}
        loading={loading}
        error={error}
      />
      <div className="flex flex-col gap-5">
        <MemoryPanel memory={memory} />
        <McpTracePanel
          entries={trace}
          onAskOtherTeam={handleAskOtherTeam}
          otherTeamBusy={otherTeamBusy}
          otherTeamResult={otherTeamResult}
        />
      </div>
    </div>
  );
}
