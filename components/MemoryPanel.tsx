import type { MemoryStore } from "@/lib/agent/memory";

/**
 * Live view of everything currently in the browser's localStorage - the
 * same role memory.build_context_summary() plays for the Python system
 * prompt, made visible here instead of hidden in a prompt.
 */
export function MemoryPanel({ memory }: { memory: MemoryStore }) {
  const entries = Object.entries(memory);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg text-navy">Memory</h3>
        <span className="tag-badge">localStorage</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-[13.5px] text-muted">
          Nothing stored yet. State a preference below and the Copilot may remember it.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map(([key, fact], i) => (
            <li key={key} className={i > 0 ? "rule-top pt-3" : ""}>
              <div className="wire text-ink">
                <span className="text-accent">{key}</span>
                <span className="text-muted">: </span>
                <span>{fact.value}</span>
              </div>
              <div className="mt-1 text-[11.5px] text-muted">
                source: {fact.source} · {new Date(fact.updatedAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[12px] text-muted">
        This survives a page reload or closing the tab, in this browser - it is not tied to the
        current chat session.
      </p>
    </div>
  );
}
