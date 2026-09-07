"use client";

import { useEffect, useState } from "react";
import { ChatPanel, type Entry } from "./ChatPanel";
import { MemoryPanel } from "./MemoryPanel";
import { applyMemoryOps, clearMemory, loadMemory } from "@/lib/client/memoryStorage";
import type { PendingAction, TraceStep } from "@/lib/agent/run";
import type { MemoryStore } from "@/lib/agent/memory";
import type { RpcLogEntry } from "@/lib/mcp/client";

/**
 * One chat. Everything the agent does is shown in the transcript, beside
 * the answer it produced: the tools it called, the protocol messages it
 * sent, and the approval prompt when it wants to change something. Memory
 * sits in one box that never moves. The concepts are explained below the
 * demo, not narrated over it.
 */

interface ChatResponse {
  reply: string;
  trace: TraceStep[];
  mcpLog: RpcLogEntry[];
  memoryOps?: Parameters<typeof applyMemoryOps>[0];
  pending?: PendingAction;
  resumeState?: unknown[];
  error?: string;
}

interface OtherResponse {
  toolsAvailable: number;
  result: { status: string; system?: string; systemStatus?: string; message?: string };
  mcpLog: RpcLogEntry[];
  error?: string;
}

export function HelpdeskDemo() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [memory, setMemory] = useState<MemoryStore>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [resumeState, setResumeState] = useState<unknown[] | null>(null);

  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  /** The API wants the conversation, not the annotations. */
  function historyFrom(list: Entry[]) {
    return list
      .filter((e): e is Extract<Entry, { kind: "user" | "agent" }> =>
        e.kind === "user" || e.kind === "agent",
      )
      .map((e) => ({
        role: e.kind === "user" ? ("user" as const) : ("assistant" as const),
        content: e.text,
      }))
      .filter((m) => m.content);
  }

  function absorb(data: ChatResponse, base: Entry[]) {
    if (data.memoryOps?.length) setMemory(applyMemoryOps(data.memoryOps));

    const next: Entry[] = [...base];
    if (data.reply || data.trace?.length) {
      next.push({
        kind: "agent",
        text: data.reply ?? "",
        tools: data.trace ?? [],
        rpc: data.mcpLog ?? [],
      });
    }
    setEntries(next);

    if (data.pending && data.resumeState) {
      setPending(data.pending);
      setResumeState(data.resumeState);
    } else {
      setPending(null);
      setResumeState(null);
    }
  }

  async function send(text: string) {
    setError(null);
    const next: Entry[] = [...entries, { kind: "user", text }];
    setEntries(next);
    setLoading(true);
    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyFrom(next), memory }),
      });
      const data = (await res.json()) as ChatResponse;
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      absorb(data, next);
    } catch {
      setError("Could not reach the Copilot. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(approved: boolean) {
    if (!resumeState) return;
    setError(null);
    setPending(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyFrom(entries),
          memory,
          resume: { state: resumeState, approved },
        }),
      });
      const data = (await res.json()) as ChatResponse;
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const base: Entry[] = approved
        ? entries
        : [...entries, { kind: "note", text: "You declined. The tool was never called." }];
      absorb(data, base);
    } catch {
      setError("Could not reach the Copilot. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function otherProgram() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/other-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: "SAP S/4HANA" }),
      });
      const data = (await res.json()) as OtherResponse;
      if (!res.ok) {
        setError(data.error ?? "The other program could not reach the tool server.");
        return;
      }
      const r = data.result;
      setEntries((prev) => [
        ...prev,
        {
          kind: "other",
          text:
            r.status === "ok"
              ? `A status bot with no model inside it asked the same server and got the same answer. ${r.system} is ${r.systemStatus}. It was offered all ${data.toolsAvailable} tools, and it never imported a line of the Copilot's code.`
              : `The status bot got an error: ${r.message ?? "unknown"}.`,
          rpc: data.mcpLog ?? [],
        },
      ]);
    } catch {
      setError("Could not reach the tool server. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function newSession() {
    setEntries([
      { kind: "note", text: "New session. The chat is empty. The memory is not." },
    ]);
    setPending(null);
    setResumeState(null);
    setError(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr] lg:items-start">
      <ChatPanel
        entries={entries}
        loading={loading}
        error={error}
        pending={pending}
        onSend={(t) => void send(t)}
        onDecide={(a) => void decide(a)}
        onNewSession={newSession}
        onOtherProgram={() => void otherProgram()}
      />
      <MemoryPanel memory={memory} onForget={() => setMemory(clearMemory())} />
    </div>
  );
}
