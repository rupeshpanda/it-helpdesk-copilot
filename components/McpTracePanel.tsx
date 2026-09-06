import type { RpcLogEntry } from "@/lib/mcp/client";

const METHOD_LABEL: Record<string, string> = {
  initialize: "initialize",
  "tools/list": "tools/list",
  "tools/call": "tools/call",
};

/**
 * Renders the raw JSON-RPC request/response pairs from the most recent
 * turn - the same information SkyVault's main.py printed as
 * "[MCP >>] / [MCP <<]" lines, made visible on the page instead of a
 * terminal.
 */
export function McpTracePanel({ log }: { log: RpcLogEntry[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg text-navy">MCP trace</h3>
        <span className="flex items-center text-[11.5px] text-muted">
          <span className="live-dot" />
          JSON-RPC
        </span>
      </div>
      {log.length === 0 ? (
        <p className="text-[13.5px] text-muted">
          Send a message to see the Host → Client → Server exchange for this turn.
        </p>
      ) : (
        <div className="space-y-3">
          {log.map((entry, i) => (
            <details key={i} className="rounded-md border border-border" open={i === log.length - 1}>
              <summary className="cursor-pointer select-none px-3 py-2 text-[13px] font-medium text-ink">
                #{entry.request.id} {METHOD_LABEL[entry.request.method] ?? entry.request.method}
                {entry.response.error && (
                  <span className="ml-2 text-danger">error {entry.response.error.code}</span>
                )}
              </summary>
              <div className="border-t border-border p-3">
                <pre className="wire min-w-0 whitespace-pre-wrap text-muted">
                  {JSON.stringify(entry.request, null, 2)}
                </pre>
                <pre className="wire min-w-0 mt-2 whitespace-pre-wrap text-ink">
                  {JSON.stringify(entry.response, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
