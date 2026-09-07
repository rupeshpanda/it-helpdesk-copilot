"use client";

import { useState } from "react";
import { describeRpc, type TraceEntry } from "@/lib/client/describeRpc";

const TONE_DOT: Record<"ok" | "error" | "info", string> = {
  ok: "bg-success",
  error: "bg-danger",
  info: "bg-muted",
};

/** The messages that crossed the MCP boundary for the last answer, one line
 * each. The raw JSON-RPC is one click away, not on by default. */
export function McpTracePanel({ entries }: { entries: TraceEntry[] }) {
  const [raw, setRaw] = useState(false);
  const twoConsumers = new Set(entries.map((e) => e.consumer)).size > 1;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-serif text-lg text-navy">MCP</h3>
        <span className="tag-badge">live</span>
      </div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-muted">
        Model Context Protocol. Three messages: connect, list, call.
      </p>

      {entries.length === 0 ? (
        <p className="text-[14px] text-ink">No messages yet.</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, i) => {
            const d = describeRpc(entry);
            return (
              <li key={i}>
                <div className="flex items-start gap-2">
                  <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${TONE_DOT[d.tone]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[14px] text-ink">{d.title}</span>
                      {twoConsumers && <span className="tag-badge">{entry.consumer}</span>}
                    </div>
                    {d.detail && <p className="text-[12.5px] text-muted">{d.detail}</p>}
                    {d.toolNames && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {d.toolNames.map((n) => (
                          <span
                            key={n}
                            className="rounded border border-border bg-bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-ink"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    )}
                    {raw && (
                      <div className="mt-2">
                        <pre className="wire min-w-0 whitespace-pre-wrap text-muted">
                          {JSON.stringify(entry.request, null, 2)}
                        </pre>
                        <pre className="wire min-w-0 mt-1.5 whitespace-pre-wrap text-ink">
                          {JSON.stringify(compactResponse(entry), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {entries.length > 0 && (
        <button
          onClick={() => setRaw((v) => !v)}
          className="mt-4 text-[12.5px] text-accent underline underline-offset-2 hover:text-accent-hover"
        >
          {raw ? "Hide the raw messages" : "Show the raw messages"}
        </button>
      )}
    </div>
  );
}

/** tools/list repeats every schema in full. In the raw view that hides the
 * shape of the message, so it is trimmed to names there. */
function compactResponse(entry: TraceEntry) {
  if (entry.request.method !== "tools/list" || !entry.response.result) return entry.response;
  const result = entry.response.result as { tools?: { name: string }[] };
  return {
    ...entry.response,
    result: { tools: (result.tools ?? []).map((t) => ({ name: t.name, description: "…", inputSchema: "…" })) },
  };
}
