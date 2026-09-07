import type { MemoryStore } from "@/lib/agent/memory";

/** Everything the Copilot has written down, read from this browser. */
export function MemoryPanel({
  memory,
  onForget,
}: {
  memory: MemoryStore;
  onForget?: () => void;
}) {
  const entries = Object.entries(memory);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg text-navy">Standing instructions</h3>
        <span className="tag-badge">memory</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-[14px] text-ink">
          Nothing stored. Anything kept here is read back at the start of every session, before you
          type.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {entries.map(([key, fact], i) => (
            <li key={key} className={i > 0 ? "rule-top pt-2.5" : ""}>
              <div className="wire text-ink">
                <span className="text-accent">{key}</span>
                <span className="text-muted">: </span>
                <span>{fact.value}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
        Kept in this browser only. Nothing is stored on a server.
        {onForget && entries.length > 0 && (
          <>
            {" "}
            <button onClick={onForget} className="text-accent underline underline-offset-2 hover:text-accent-hover">
              Forget everything
            </button>
          </>
        )}
      </p>
    </div>
  );
}
