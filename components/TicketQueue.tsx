"use client";

import { EMPLOYEES, TICKETS, type Ticket } from "@/lib/agent/data";

const PRIORITY_TONE: Record<string, string> = {
  P1: "bg-danger-bg text-danger",
  P2: "bg-warning-bg text-warning",
  P3: "bg-accent-light text-accent",
  P4: "bg-bg-secondary text-muted",
};

/** The queue an analyst would actually be looking at. Working one of these
 * is the business task; the tools, protocol and memory are how it gets done. */
export function TicketQueue({
  onWork,
  busy,
}: {
  onWork: (ticket: Ticket) => void;
  busy: boolean;
}) {
  const open = Object.values(TICKETS).filter(
    (t) => t.status === "open" || t.status === "in_progress",
  );

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="font-serif text-lg text-navy">Ticket queue</h3>
        <span className="text-[12.5px] text-muted">{open.length} waiting</span>
      </div>
      <ul>
        {open.map((t) => {
          const who = EMPLOYEES[t.employeeId];
          return (
            <li key={t.ticketId} className="border-b border-border px-5 py-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12.5px] text-ink">{t.ticketId}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    PRIORITY_TONE[t.priority] ?? ""
                  }`}
                >
                  {t.priority}
                </span>
                <span className="text-[12.5px] text-muted">{t.system}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{t.description}</p>
              <p className="mt-1 text-[12.5px] text-muted">
                {who ? `${who.name}, ${who.department}, ${who.location}` : t.employeeId}
              </p>
              <button
                onClick={() => onWork(t)}
                disabled={busy}
                className="mt-2.5 rounded-md bg-navy px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-indigo-dark disabled:opacity-40"
              >
                Work this ticket
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** What an analyst would type. Kept here so the button and the transcript
 * say the same thing. */
export function workTicketPrompt(t: Ticket): string {
  return `Work ticket ${t.ticketId}. Check who raised it, whether the system is healthy, and whether a known fix applies. Then tell me what should happen, and escalate it to the right team if that is the right call.`;
}
