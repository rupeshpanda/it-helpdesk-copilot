"use client";

import { describeRpc, type TraceEntry } from "@/lib/client/describeRpc";

const TONE_DOT: Record<"ok" | "error" | "info", string> = {
  ok: "bg-success",
  error: "bg-danger",
  info: "bg-muted",
};

/**
 * The Host -> Client -> Server exchange for the current turn, described in
 * plain language first and raw JSON-RPC second. Also hosts the "different
 * team's bot" control, which appends a second consumer's exchange to the
 * same list so a reader can see the same server answering a different
 * client with the same three messages.
 */
export function McpTracePanel({
  entries,
  onAskOtherTeam,
  otherTeamBusy,
  otherTeamResult,
}: {
  entries: TraceEntry[];
  onAskOtherTeam: () => void;
  otherTeamBusy: boolean;
  otherTeamResult: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-serif text-lg text-navy">MCP trace</h3>
        <span className="flex items-center text-[11.5px] text-muted">
          <span className="live-dot" />
          live
        </span>
      </div>
      <p className="mb-4 text-[12px] leading-relaxed text-muted">
        Model Context Protocol: an open standard for how an agent talks to its tools. Each entry
        below is one message across that boundary.
      </p>

      {entries.length === 0 ? (
        <p className="text-[13.5px] text-muted">
          Send a message, or ask the other team&rsquo;s bot below, to see the exchange.
        </p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry, i) => {
            const d = describeRpc(entry);
            return (
              <li key={i} className="rounded-md border border-border p-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-[6px] h-2 w-2 shrink-0 rounded-full ${TONE_DOT[d.tone]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-medium text-ink">{d.title}</span>
                      <span className="font-mono text-[11px] text-muted">
                        #{entry.request.id} {entry.request.method}
                      </span>
                      <span className="tag-badge">{entry.consumer}</span>
                    </div>
                    {d.detail && (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{d.detail}</p>
                    )}
                    {d.toolNames && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
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
                    <details className="mt-2">
                      <summary className="cursor-pointer select-none text-[11.5px] text-muted hover:text-ink">
                        Show wire format (JSON-RPC)
                      </summary>
                      <pre className="wire min-w-0 mt-2 whitespace-pre-wrap text-muted">
                        {JSON.stringify(entry.request, null, 2)}
                      </pre>
                      <pre className="wire min-w-0 mt-2 whitespace-pre-wrap text-ink">
                        {JSON.stringify(compactResponse(entry), null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="rule-top mt-5 pt-4">
        <button
          onClick={onAskOtherTeam}
          disabled={otherTeamBusy}
          className="rounded-md border border-border bg-bg-secondary px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {otherTeamBusy ? "Asking…" : "Ask a different team's bot"}
        </button>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          A separate program with no language model in it, reaching the same tool server through
          the same three messages. Watch a second client name appear in the handshake.
        </p>
        {otherTeamResult && (
          <p className="mt-2 text-[13px] text-ink">{otherTeamResult}</p>
        )}
      </div>
    </div>
  );
}

/** The tools/list response repeats every schema in full; in the wire view
 * that is more noise than signal, so it is trimmed to names there. The
 * plain-language entry above already lists them. */
function compactResponse(entry: TraceEntry) {
  if (entry.request.method !== "tools/list" || !entry.response.result) return entry.response;
  const result = entry.response.result as { tools?: { name: string }[] };
  return {
    ...entry.response,
    result: { tools: (result.tools ?? []).map((t) => ({ name: t.name, description: "…", inputSchema: "…" })) },
  };
}
