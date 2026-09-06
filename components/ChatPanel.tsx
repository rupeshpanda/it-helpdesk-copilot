"use client";

import { useState } from "react";
import type { ChatTurn } from "@/lib/agent/run";

const PRESETS = [
  "My employee ID is jsmith02. Always route my tickets to SAP Basis - Central, remember that.",
  "Escalate my open ticket to the right team.",
  "Is SAP S/4HANA up right now?",
  "I can't connect SAP GUI over VPN, what should I try?",
];

export function ChatPanel({
  messages,
  onSend,
  onNewSession,
  loading,
  error,
}: {
  messages: ChatTurn[];
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
          New session
        </button>
      </div>

      <div className="flex min-h-[280px] flex-col gap-3 overflow-y-auto p-5" style={{ maxHeight: 420 }}>
        {messages.length === 0 && (
          <p className="text-[13.5px] text-muted">
            Ask about a ticket, a system's status, or say something you want remembered for next
            time - then click &ldquo;New session&rdquo; and ask a follow-up that depends on it.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
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
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => submit(p)}
              className="rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {p.length > 46 ? `${p.slice(0, 46)}…` : p}
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
