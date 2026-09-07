"use client";

import { useState } from "react";
import type { ChatTurn, TraceStep } from "@/lib/agent/run";
import { describeToolCall } from "@/lib/client/describeToolCall";

type DisplayMessage = ChatTurn & { toolCalls?: TraceStep[] };

const STEP_ONE = "My employee ID is jsmith02. Always route my tickets to SAP Basis - Central, remember that.";
const STEP_THREE = "Escalate my open ticket to the right team.";

const EXTRAS = [
  "Is SAP S/4HANA up right now?",
  "I cannot connect SAP GUI over VPN, what should I try?",
];

function StepButton({
  n,
  label,
  text,
  onClick,
  disabled,
}: {
  n: string;
  label: string;
  text: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start gap-3 rounded-md border border-border bg-bg-secondary px-3 py-2 text-left transition-colors hover:border-accent disabled:opacity-40"
    >
      <span className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-[11px] text-white">
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        <span className="block text-[12px] leading-snug text-muted">{text}</span>
      </span>
    </button>
  );
}

export function ChatPanel({
  messages,
  onSend,
  onNewSession,
  loading,
  error,
}: {
  messages: DisplayMessage[];
  onSend: (text: string) => void;
  onNewSession: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [draft, setDraft] = useState("");

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setDraft("");
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="font-serif text-lg text-navy">IT Helpdesk Copilot</h3>
        <button
          onClick={onNewSession}
          className="text-[13px] text-muted transition-colors hover:text-ink"
        >
          New session (memory kept)
        </button>
      </div>

      <div className="flex min-h-[280px] flex-col gap-3 overflow-y-auto p-5" style={{ maxHeight: 420 }}>
        {messages.length === 0 && (
          <p className="text-[13.5px] text-muted">
            Follow the three steps below to see memory survive a new session, or ask anything
            about tickets, system status, or access.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            {m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && (
              <div className="mb-1.5 max-w-[85%] space-y-1">
                {m.toolCalls.map((step, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-1.5 text-[12px] text-muted"
                    title={JSON.stringify(step.result)}
                  >
                    <span className="mt-[1px] shrink-0">
                      {step.result.status === "ok" ? "🔧" : "⚠️"}
                    </span>
                    <span>{describeToolCall(step)}</span>
                  </div>
                ))}
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                m.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-[13px] text-muted">Copilot is checking its tools...</p>}
        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>

      <div className="border-t border-border p-4">
        <p className="section-label !mb-2 !text-[11px]">Try the memory flow</p>
        <div className="mb-3 space-y-1.5">
          <StepButton
            n="1"
            label="Teach it something"
            text={STEP_ONE}
            onClick={() => submit(STEP_ONE)}
            disabled={loading}
          />
          <StepButton
            n="2"
            label="Start a new session"
            text="Clears the chat. Keeps what it learned, which is the point."
            onClick={onNewSession}
            disabled={loading}
          />
          <StepButton
            n="3"
            label="Ask something that depends on it"
            text={STEP_THREE}
            onClick={() => submit(STEP_THREE)}
            disabled={loading}
          />
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {EXTRAS.map((p) => (
            <button
              key={p}
              onClick={() => submit(p)}
              disabled={loading}
              className="rounded-full border border-border bg-bg px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
          className="flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the Copilot something..."
            maxLength={400}
            className="flex-1 rounded-md border border-border bg-bg px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="rounded-md bg-navy px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-indigo-dark disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
