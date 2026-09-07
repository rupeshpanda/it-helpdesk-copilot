"use client";

import { useState } from "react";
import type { ChatTurn, PendingAction, TraceStep } from "@/lib/agent/run";
import { describeToolCall } from "@/lib/client/describeToolCall";

export type DisplayMessage = ChatTurn & { toolCalls?: TraceStep[] };

/** The transcript: what was said, and above each reply, what the Copilot did
 * before saying it. The composer only appears once the walkthrough is over. */
export function ChatPanel({
  messages,
  loading,
  error,
  note,
  showComposer,
  onSend,
  pending,
  onDecide,
}: {
  messages: DisplayMessage[];
  loading: boolean;
  error: string | null;
  note: string | null;
  showComposer: boolean;
  onSend: (text: string) => void;
  pending?: PendingAction | null;
  onDecide?: (approved: boolean) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <div className="flex min-h-[160px] flex-col gap-3 overflow-y-auto" style={{ maxHeight: 420 }}>
        {note && <p className="text-[13.5px] text-ink">{note}</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            {m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && (
              <div className="mb-1.5 max-w-[85%] space-y-1">
                {m.toolCalls.map((step, j) => (
                  <div key={j} className="flex items-start gap-1.5 text-[12.5px] text-muted">
                    <span className="mt-[1px] shrink-0">{step.result.status === "ok" ? "🔧" : "⚠️"}</span>
                    <span>{describeToolCall(step)}</span>
                  </div>
                ))}
              </div>
            )}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed ${
                m.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && onDecide && (
          <div className="rounded-lg border border-gold bg-warning-bg p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-warning">
              Waiting for you
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink">
              The Copilot is asking to do this:
            </p>
            <p className="mt-1.5 wire text-ink">{pending.summary}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Nothing has run. The model can only ask. This is your code holding the action until
              a person answers.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onDecide(true)}
                disabled={loading}
                className="rounded-md bg-navy px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-indigo-dark disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={() => onDecide(false)}
                disabled={loading}
                className="rounded-md border border-border bg-card px-4 py-2 text-[13.5px] text-ink transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
              >
                Decline
              </button>
            </div>
          </div>
        )}
        {loading && <p className="text-[13px] text-muted">The Copilot is checking its tools.</p>}
        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>

      {showComposer && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft.trim();
            if (!t || loading) return;
            onSend(t);
            setDraft("");
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the Copilot"
            maxLength={400}
            className="flex-1 rounded-md border border-border bg-bg px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="rounded-md bg-navy px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-indigo-dark disabled:opacity-40"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
