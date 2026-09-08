"use client";

import { useState } from "react";
import { describeRpc } from "@/lib/client/describeRpc";
import type { RpcLogEntry } from "@/lib/mcp/client";

/**
 * MCP treated as what it is: the wiring, not a behaviour. Nothing in this
 * panel changes what the agent decided. It shows how the agent reached the
 * tools at all, and that a second program reaches them the same way.
 */
export function McpPanel({ mcpLog }: { mcpLog: RpcLogEntry[] }) {
  const [raw, setRaw] = useState(false);
  const [other, setOther] = useState<{ text: string; log: RpcLogEntry[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const toolNames =
    (mcpLog
      .find((e) => e.request.method === "tools/list")
      ?.response.result as { tools?: { name: string }[] } | undefined)?.tools?.map((t) => t.name) ??
    [];

  async function askOther() {
    setBusy(true);
    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/other-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: "SAP S/4HANA" }),
      });
      const data = await res.json();
      if (res.ok) {
        setOther({
          text: `A status bot with no model inside it. It was offered the same ${data.toolsAvailable} tools and got the same answer: ${data.result.system} is ${data.result.systemStatus}.`,
          log: data.mcpLog ?? [],
        });
      }
    } catch {
      // The panel is illustrative. A failure here is not worth an alarm.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <span className="section-label">How it reached those tools</span>
      <h3 className="font-serif text-xl text-navy">The agent does not know what it can do</h3>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink">
        It has to ask. Before working the ticket it opened a connection to the tool server,
        requested the list of what exists, and only then chose one. That exchange is the Model
        Context Protocol. Three messages, in the same shape every time.
      </p>

      {toolNames.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">
            What the server offered it
          </p>
          <div className="flex flex-wrap gap-1.5">
            {toolNames.map((n) => (
              <span
                key={n}
                className="rounded border border-border bg-bg-secondary px-2 py-0.5 font-mono text-[11.5px] text-ink"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            That list is not written into the agent. Remove one on the server and the agent stops
            being able to do it, without a line of the agent changing.
          </p>
        </div>
      )}

      {mcpLog.length > 0 && (
        <div className="mt-5">
          <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">
            The messages it sent
          </p>
          <ol className="space-y-1">
            {mcpLog.map((entry, i) => {
              const d = describeRpc(entry);
              return (
                <li key={i} className="text-[13px] leading-relaxed">
                  <span className="text-ink">{d.title}</span>
                  <span className="ml-2 font-mono text-[11px] text-muted">
                    {entry.request.method}
                  </span>
                </li>
              );
            })}
          </ol>
          <button
            onClick={() => setRaw((v) => !v)}
            className="mt-2 text-[12.5px] text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            {raw ? "Hide" : "Show"} the wire format
          </button>
          {raw && (
            <pre className="wire mt-2 whitespace-pre-wrap text-muted">
              {JSON.stringify(
                mcpLog.map((e) => ({ request: e.request })),
                null,
                2,
              )}
            </pre>
          )}
        </div>
      )}

      <div className="rule-top mt-5 pt-4">
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink">
          Because the door is a standard one, the agent is not the only thing that can walk through
          it. A second team does not need a copy of your agent, or your tool code.
        </p>
        <button
          onClick={() => void askOther()}
          disabled={busy}
          className="mt-3 rounded-md border border-border bg-bg-secondary px-3.5 py-2 text-[13px] text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {busy ? "Asking…" : "Let a different program use the same tools"}
        </button>
        {other && (
          <div className="mt-3">
            <p className="text-[13.5px] leading-relaxed text-ink">{other.text}</p>
            <ol className="mt-1.5 space-y-0.5">
              {other.log.map((entry, i) => (
                <li key={i} className="text-[12.5px] text-muted">
                  {describeRpc(entry).title}
                  <span className="ml-2 font-mono text-[11px]">{entry.request.method}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          Both run inside one function here, so this is the interface rather than a network hop.
          The messages are the same either way, which is the part that matters.
        </p>
      </div>
    </div>
  );
}
