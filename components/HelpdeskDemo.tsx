"use client";

import { useState } from "react";
import { EMPLOYEES, TICKETS } from "@/lib/agent/data";
import { POLICY_TEXT, TICKET_ID, VARIANTS, type VariantKey } from "@/lib/agent/variants";
import type { TraceStep } from "@/lib/agent/run";
import type { RpcLogEntry } from "@/lib/mcp/client";
import { describeToolCall } from "@/lib/client/describeToolCall";
import { judgeNoTools } from "@/lib/client/verdict";
import { McpPanel } from "./McpPanel";

/**
 * One ticket, worked three ways at once. Everything is held constant except
 * what the agent can reach and what it has been told to remember, so the
 * difference between the columns is the lesson.
 */

interface Run {
  answer: string;
  tools: TraceStep[];
  proposal: string | null;
  mcpLog: RpcLogEntry[];
  elapsedMs: number;
}

type PanelState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; run: Run }
  | { status: "failed"; error: string };

const ORDER: VariantKey[] = ["none", "tools", "memory"];

const TAKEAWAY: Record<VariantKey, string> = {
  none: "", // computed from the run, see judgeNoTools
  tools: "Four lookups against real records. It routes to the team the ticket is assigned to.",
  memory: "The same four lookups, in the same order. A standing instruction sends it somewhere else.",
};

export function HelpdeskDemo() {
  const [panels, setPanels] = useState<Record<VariantKey, PanelState>>({
    none: { status: "idle" },
    tools: { status: "idle" },
    memory: { status: "idle" },
  });
  const [busy, setBusy] = useState(false);

  const ticket = TICKETS[TICKET_ID];
  const who = EMPLOYEES[ticket.employeeId];

  async function runAll() {
    setBusy(true);
    setPanels({ none: { status: "running" }, tools: { status: "running" }, memory: { status: "running" } });

    await Promise.all(
      ORDER.map(async (variant) => {
        try {
          const res = await fetch("/api/lab/it-helpdesk-copilot/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variant }),
          });
          const data = await res.json();
          setPanels((p) => ({
            ...p,
            [variant]: res.ok
              ? { status: "done", run: data as Run }
              : { status: "failed", error: data.error ?? "Something went wrong." },
          }));
        } catch {
          setPanels((p) => ({
            ...p,
            [variant]: { status: "failed", error: "Could not reach the Copilot." },
          }));
        }
      }),
    );

    setBusy(false);
  }

  const toolsRun = panels.tools.status === "done" ? panels.tools.run : null;
  const anyDone = ORDER.some((v) => panels[v].status === "done");

  return (
    <div className="space-y-6">
      {/* The task */}
      <div className="rounded-lg border border-border bg-card p-5">
        <span className="section-label">The ticket</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[13px] text-ink">{ticket.ticketId}</span>
          <span className="rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted">
            {ticket.priority}
          </span>
          <span className="text-[13px] text-muted">{ticket.system}</span>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{ticket.description}</p>
        <p className="mt-1 text-[13px] text-muted">
          Raised by {who.name}, {who.department}, {who.location}. Currently assigned to{" "}
          {ticket.assignedTeam}.
        </p>

        <button
          onClick={() => void runAll()}
          disabled={busy}
          className="mt-4 rounded-md bg-navy px-5 py-2.5 text-[14.5px] font-medium text-white transition-colors hover:bg-indigo-dark disabled:opacity-40"
        >
          {busy ? "Working the ticket…" : "Work this ticket three ways"}
        </button>
        <p className="mt-2 text-[12.5px] text-muted">
          One model. One ticket. Three configurations, run at the same time.
        </p>
      </div>

      {/* The three runs */}
      <div className="grid gap-5 lg:grid-cols-3">
        {ORDER.map((variant) => (
          <Panel
            key={variant}
            variant={variant}
            state={panels[variant]}
            takeaway={TAKEAWAY[variant]}
          />
        ))}
      </div>

      {anyDone && <McpPanel mcpLog={toolsRun?.mcpLog ?? []} />}
    </div>
  );
}

function Panel({
  variant,
  state,
  takeaway,
}: {
  variant: VariantKey;
  state: PanelState;
  takeaway: string;
}) {
  const config = VARIANTS[variant];

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-serif text-[17px] text-navy">{config.title}</h3>
        <p className="mt-0.5 text-[12.5px] text-muted">{config.setup}</p>
        {variant === "memory" && (
          <p className="wire mt-2 rounded border border-border bg-bg-secondary px-2 py-1.5 text-ink">
            {POLICY_TEXT}
          </p>
        )}
      </div>

      <div className="flex-1 px-4 py-3.5">
        {state.status === "idle" && (
          <p className="text-[13px] text-muted">Waiting.</p>
        )}
        {state.status === "running" && (
          <p className="text-[13px] text-muted">Working…</p>
        )}
        {state.status === "failed" && <p className="text-[13px] text-danger">{state.error}</p>}
        {state.status === "done" && (
          <>
            <div className="mb-3">
              <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">
                What it looked up
              </p>
              {state.run.tools.length === 0 ? (
                <p className="text-[13px] text-danger">
                  Nothing. It had no tools, so it never checked anything.
                </p>
              ) : (
                <ul className="space-y-1">
                  {state.run.tools.map((t, i) => (
                    <li key={i} className="text-[12.5px] leading-snug text-muted">
                      {describeToolCall(t)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-3">
              <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">
                What it decided
              </p>
              {state.run.proposal ? (
                <p className="rounded border border-gold bg-warning-bg px-2 py-1.5 text-[13px] leading-snug text-ink">
                  Asks to {state.run.proposal.charAt(0).toLowerCase() + state.run.proposal.slice(1)}
                </p>
              ) : (
                <p className="text-[13px] text-muted">No action proposed.</p>
              )}
            </div>

            <details>
              <summary className="cursor-pointer select-none text-[12px] text-muted hover:text-ink">
                Read the full answer
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">
                {state.run.answer || "It produced no text."}
              </p>
            </details>
          </>
        )}
      </div>

      <p className="border-t border-border px-4 py-3 text-[13px] leading-relaxed text-ink">
        {variant === "none" && state.status === "done"
          ? judgeNoTools(state.run.answer).line
          : variant === "none"
            ? "The model on its own, with no way to reach a ticket, a system or a person."
            : takeaway}
      </p>
    </div>
  );
}
