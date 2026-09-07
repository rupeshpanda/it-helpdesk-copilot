"use client";

import { useEffect, useState } from "react";
import { ChatPanel, type DisplayMessage } from "./ChatPanel";
import { MemoryPanel } from "./MemoryPanel";
import { McpTracePanel } from "./McpTracePanel";
import { applyMemoryOps, clearMemory, loadMemory } from "@/lib/client/memoryStorage";
import type { TraceEntry } from "@/lib/client/describeRpc";
import type { TraceStep } from "@/lib/agent/run";
import type { MemoryStore } from "@/lib/agent/memory";
import type { RpcLogEntry } from "@/lib/mcp/client";

/**
 * A walkthrough in three acts, one concept each, showing only what that act
 * needs. Tools first: one question, one reply, one line saying what it did.
 * Memory second: teach it, start over, ask again; the memory box appears
 * only once there is something in it. MCP third: the messages behind the
 * last answer, then a second program using the same server. Free chat comes
 * after, once the reader knows what each box is.
 */

const AGENT = "the Copilot";
const OTHER = "another program";

const ASK_STATUS = "Is SAP S/4HANA up right now?";
const TEACH = "My employee ID is jsmith02. Route my tickets to SAP Basis - Central.";
const ASK_ESCALATE = "Escalate my open ticket to the right team.";

type Act = 1 | 2 | 3 | 4;

const ACT: Record<1 | 2 | 3, { label: string; intro: string }> = {
  1: {
    label: "Tools",
    intro: "The model cannot read a database. It asks a tool to, and the code decides whether to run it.",
  },
  2: {
    label: "Memory",
    intro: "A conversation forgets when it ends. Memory is a second place to write things down.",
  },
  3: {
    label: "MCP",
    intro: "Every tool call so far crossed a standard boundary. This is what went across it.",
  },
};

interface ChatResponse {
  reply: string;
  trace: TraceStep[];
  mcpLog: RpcLogEntry[];
  memoryOps?: Parameters<typeof applyMemoryOps>[0];
  error?: string;
}

interface OtherResponse {
  toolsAvailable: number;
  result: { status: string; system?: string; systemStatus?: string; message?: string };
  mcpLog: RpcLogEntry[];
  error?: string;
}

export function HelpdeskDemo() {
  const [act, setAct] = useState<Act>(1);
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [memory, setMemory] = useState<MemoryStore>({});
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [otherResult, setOtherResult] = useState<string | null>(null);

  // localStorage is only readable after mount.
  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  async function send(text: string): Promise<boolean> {
    setError(null);
    setNote(null);
    const next: DisplayMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, memory }),
      });
      const data = (await res.json()) as ChatResponse;
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return false;
      }
      setTrace((data.mcpLog ?? []).map((e) => ({ ...e, consumer: AGENT })));
      setOtherResult(null);
      if (data.memoryOps?.length) setMemory(applyMemoryOps(data.memoryOps));
      setMessages([...next, { role: "assistant", content: data.reply, toolCalls: data.trace ?? [] }]);
      return true;
    } catch {
      setError("Could not reach the Copilot. Try again in a moment.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function askOtherProgram(): Promise<boolean> {
    setLoading(true);
    setOtherResult(null);
    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/other-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: "SAP S/4HANA" }),
      });
      const data = (await res.json()) as OtherResponse;
      if (!res.ok) {
        setError(data.error ?? "The other program could not reach the tool server.");
        return false;
      }
      setTrace((prev) => [...prev, ...(data.mcpLog ?? []).map((e) => ({ ...e, consumer: OTHER }))]);
      const r = data.result;
      setOtherResult(
        r.status === "ok"
          ? `A status bot with no model in it asked the same server. ${r.system} is ${r.systemStatus}.`
          : `The status bot got an error: ${r.message ?? "unknown"}.`,
      );
      return true;
    } catch {
      setError("Could not reach the tool server. Try again in a moment.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function go(next: Act, forget = false) {
    setAct(next);
    setStep(0);
    setMessages([]);
    setNote(null);
    setError(null);
    if (next === 1) {
      setTrace([]);
      setOtherResult(null);
    }
    if (forget) setMemory(clearMemory());
  }

  async function run(action: () => Promise<boolean>, nextStep: number) {
    if (await action()) setStep(nextStep);
  }

  const showMemory = act > 2 || (act === 2 && step >= 1);
  const showTrace = act >= 3;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        {act !== 4 ? (
          <div className="mb-5">
            <span className="section-label">
              Step {act} of 3 · {ACT[act].label}
            </span>
            <p className="text-[15px] leading-relaxed text-ink">{ACT[act].intro}</p>
          </div>
        ) : (
          <div className="mb-5">
            <span className="section-label">Your turn</span>
            <p className="text-[15px] leading-relaxed text-ink">
              Ask about a ticket, a system, or an employee&rsquo;s access.
            </p>
          </div>
        )}

        <ChatPanel
          messages={messages}
          loading={loading}
          error={error}
          note={note}
          showComposer={act === 4}
          onSend={(t) => void send(t)}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {act === 1 && step === 0 && (
            <Action disabled={loading} onClick={() => run(() => send(ASK_STATUS), 1)}>
              Ask: {ASK_STATUS}
            </Action>
          )}
          {act === 1 && step === 1 && <Next onClick={() => go(2)}>Next: memory</Next>}

          {act === 2 && step === 0 && (
            <Action disabled={loading} onClick={() => run(() => send(TEACH), 1)}>
              Tell it: {TEACH}
            </Action>
          )}
          {act === 2 && step === 1 && (
            <Action
              disabled={loading}
              onClick={() => {
                setMessages([]);
                setNote("New session. The chat is empty. The memory is not.");
                setStep(2);
              }}
            >
              Start over
            </Action>
          )}
          {act === 2 && step === 2 && (
            <Action disabled={loading} onClick={() => run(() => send(ASK_ESCALATE), 3)}>
              Ask: {ASK_ESCALATE}
            </Action>
          )}
          {act === 2 && step === 3 && <Next onClick={() => go(3)}>Next: MCP</Next>}

          {act === 3 && step === 0 && (
            <>
              <Action disabled={loading} onClick={() => run(askOtherProgram, 1)}>
                Let a different program use the same tools
              </Action>
              <button onClick={() => go(4)} className="text-[13px] text-muted hover:text-ink">
                Skip
              </button>
            </>
          )}
          {act === 3 && step === 1 && <Next onClick={() => go(4)}>Finish</Next>}

          {act === 4 && (
            <>
              <button onClick={() => go(1)} className="text-[13px] text-muted hover:text-ink">
                Start again
              </button>
              <button onClick={() => go(1, true)} className="text-[13px] text-muted hover:text-ink">
                Start again and forget everything
              </button>
            </>
          )}
        </div>
        {otherResult && <p className="mt-3 text-[14px] text-ink">{otherResult}</p>}
      </div>

      {(showMemory || showTrace) && (
        <div className={`grid gap-5 ${showMemory && showTrace ? "lg:grid-cols-2" : ""}`}>
          {showMemory && (
            <MemoryPanel memory={memory} onForget={act === 4 ? () => setMemory(clearMemory()) : undefined} />
          )}
          {showTrace && <McpTracePanel entries={trace} />}
        </div>
      )}
    </div>
  );
}

function Action({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-navy px-4 py-2.5 text-left text-[14px] font-medium text-white transition-colors hover:bg-indigo-dark disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Next({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-accent px-4 py-2.5 text-[14px] font-medium text-accent transition-colors hover:bg-accent-light"
    >
      {children} →
    </button>
  );
}
