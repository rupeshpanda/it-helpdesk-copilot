"use client";

import { useState } from "react";
import type { PendingAction, TraceStep } from "@/lib/agent/run";
import type { RpcLogEntry } from "@/lib/mcp/client";
import { describeToolCall } from "@/lib/client/describeToolCall";
import { describeRpc } from "@/lib/client/describeRpc";

/** One line in the transcript. An agent turn carries the evidence that
 * produced it, so nothing ever refers to a conversation that has scrolled
 * away or been cleared. */
export type Entry =
  | { kind: "user"; text: string }
  | { kind: "agent"; text: string; tools: TraceStep[]; rpc: RpcLogEntry[] }
  | { kind: "note"; text: string }
  | { kind: "other"; text: string; rpc: RpcLogEntry[] };

export const PROMPTS = [
  {
    label: "Give it a routing policy",
    text: "Remember this: all tickets raised from California offices go to SAP Basis - East, whatever team the ticket is currently assigned to.",
  },
  { label: "Ask what it has been told", text: "What standing instructions do you have?" },
  { label: "Check a system", text: "Is SAP S/4HANA up right now?" },
];

export function ChatPanel({
  entries,
  loading,
  error,
  pending,
  onSend,
  onDecide,
  onNewSession,
  onOtherProgram,
}: {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  pending: PendingAction | null;
  onSend: (text: string) => void;
  onDecide: (approved: boolean) => void;
  onNewSession: () => void;
  onOtherProgram: () => void;
}) {
  const [draft, setDraft] = useState("");

  function submit(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    onSend(t);
    setDraft("");
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="font-serif text-lg text-navy">IT Helpdesk Copilot</h3>
        <button
          onClick={onNewSession}
          className="text-[13px] text-muted transition-colors hover:text-ink"
        >
          Start a new session
        </button>
      </div>

      <div
        className="flex min-h-[220px] flex-col gap-4 overflow-y-auto px-5 py-4"
        style={{ maxHeight: 460 }}
      >
        {entries.length === 0 && (
          <div className="text-[13.5px] leading-relaxed text-muted">
            <p>Pick a ticket from the queue and press Work this ticket.</p>
            <p className="mt-2">
              To see memory change the outcome: work the Concur ticket, give the Copilot the
              routing policy below, start a new session, then work the same ticket again.
            </p>
          </div>
        )}

        {entries.map((e, i) => {
          if (e.kind === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="chat-bubble-user max-w-[85%] rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed">
                  {e.text}
                </div>
              </div>
            );
          }
          if (e.kind === "note") {
            return (
              <p key={i} className="text-[13px] text-muted">
                {e.text}
              </p>
            );
          }
          if (e.kind === "other") {
            return (
              <div key={i} className="rounded-md border border-border bg-bg-secondary p-3">
                <p className="text-[13.5px] leading-relaxed text-ink">{e.text}</p>
                <Protocol rpc={e.rpc} label="the same three messages, from a different program" />
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col items-start">
              {e.tools.length > 0 && (
                <div className="mb-1.5 max-w-[85%] space-y-1">
                  {e.tools.map((step, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-[12.5px] text-muted">
                      <span className="mt-[1px] shrink-0">
                        {step.result.status === "ok" ? "🔧" : "⚠️"}
                      </span>
                      <span>{describeToolCall(step)}</span>
                    </div>
                  ))}
                </div>
              )}
              {e.text && (
                <div className="chat-bubble-agent max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed">
                  {e.text}
                </div>
              )}
              <Protocol rpc={e.rpc} />
            </div>
          );
        })}

        {pending && (
          <div className="rounded-lg border border-gold bg-warning-bg p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-warning">
              Waiting for you
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink">
              The Copilot is asking to do this:
            </p>
            <p className="wire mt-1.5 text-ink">{pending.summary}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Nothing has run. The model can only ask. This is your code holding the action until a
              person answers.
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

      <div className="border-t border-border p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {PROMPTS.map((p, i) => (
            <button
              key={p.text}
              onClick={() => submit(p.text)}
              disabled={loading}
              title={p.text}
              className="rounded-full border border-border bg-bg px-3 py-1.5 text-[12.5px] text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <span className="mr-1.5 font-mono text-[11px] text-muted">{i + 1}</span>
              {p.label}
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
            placeholder="Or ask your own question"
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

        <button
          onClick={onOtherProgram}
          disabled={loading}
          className="mt-3 text-[12.5px] text-accent underline underline-offset-2 transition-colors hover:text-accent-hover disabled:opacity-40"
        >
          Let a different program use the same tools
        </button>
      </div>
    </div>
  );
}

/** The protocol messages that produced the answer directly above, quiet by
 * default. This is MCP, shown where it happened rather than in a panel
 * describing some other conversation. */
function Protocol({ rpc, label }: { rpc: RpcLogEntry[]; label?: string }) {
  const [open, setOpen] = useState(false);
  if (rpc.length === 0) return null;

  return (
    <div className="mt-1.5 max-w-[85%]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] text-muted underline underline-offset-2 hover:text-ink"
      >
        {open ? "Hide" : "Show"} the {rpc.length} messages it sent
        {label ? `: ${label}` : " across the MCP boundary"}
      </button>
      {open && (
        <ol className="mt-2 space-y-1.5 border-l-2 border-border pl-3">
          {rpc.map((entry, i) => {
            const d = describeRpc(entry);
            return (
              <li key={i} className="text-[12.5px] leading-relaxed">
                <span className="text-ink">{d.title}</span>
                <span className="ml-2 font-mono text-[11px] text-muted">
                  {entry.request.method}
                </span>
                {d.toolNames && (
                  <span className="mt-1 block font-mono text-[11px] text-muted">
                    {d.toolNames.join(", ")}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
