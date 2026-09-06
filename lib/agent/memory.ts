/**
 * Persistent memory, adapted for a stateless serverless function.
 *
 * SkyVault's Python memory.py backed remember()/recall() with a JSON file on
 * disk - state that outlives the process. A Vercel Node function has no disk
 * to write to between requests, so this demo uses the browser's
 * localStorage as the "disk" instead: the client sends its current memory
 * facts with every chat request, this module executes remember/recall
 * against that blob for the current turn, and any writes come back as
 * `MemoryOp`s the client applies to localStorage after the response lands.
 *
 * The conflict rule is unchanged from SkyVault: same key overwrites the old
 * value - last write wins. The previous value is kept only as an audit
 * trail on the record, never surfaced by recall() or the context summary.
 */

export interface MemoryFact {
  value: string;
  source: string;
  updatedAt: string;
  previousValue?: string;
  previousUpdatedAt?: string;
}

export type MemoryStore = Record<string, MemoryFact>;

export interface MemoryOp {
  op: "set";
  key: string;
  value: string;
  source: string;
  updatedAt: string;
}

export function buildContextSummary(memory: MemoryStore, maxFacts = 20): string {
  const entries = Object.entries(memory).slice(0, maxFacts);
  if (entries.length === 0) return "No facts are currently stored in memory.";
  const lines = entries.map(
    ([key, fact]) => `- ${key}: ${fact.value} (source: ${fact.source})`,
  );
  return "Known facts from previous sessions:\n" + lines.join("\n");
}

/**
 * Creates request-scoped remember()/recall() tool functions bound to a
 * mutable working copy of `initialMemory`, plus the list of MemoryOps the
 * API route should return to the client. A closure over `working` and `ops`
 * stands in for the JSON file the Python version read and rewrote on disk -
 * scoped to one request instead of the process lifetime.
 */
export function createMemoryTools(initialMemory: MemoryStore) {
  const working: MemoryStore = { ...initialMemory };
  const ops: MemoryOp[] = [];

  function remember(args: { key: string; value: string; source?: string }) {
    const key = args.key;
    const value = args.value;
    const source = args.source ?? "user";
    const now = new Date().toISOString();
    const previous = working[key];

    const fact: MemoryFact = { value, source, updatedAt: now };
    if (previous && previous.value !== value) {
      fact.previousValue = previous.value;
      fact.previousUpdatedAt = previous.updatedAt;
    }
    working[key] = fact;
    ops.push({ op: "set", key, value, source, updatedAt: now });

    return {
      status: "ok" as const,
      key,
      value,
      overwrotePreviousValue: previous ? previous.value : null,
    };
  }

  function recall(args: { query: string }) {
    const query = args.query;
    if (Object.keys(working).length === 0) {
      return { status: "ok" as const, matches: [] };
    }
    if (working[query]) {
      const f = working[query];
      return {
        status: "ok" as const,
        matches: [{ key: query, value: f.value, source: f.source, updatedAt: f.updatedAt }],
      };
    }
    const q = query.toLowerCase();
    const matches = Object.entries(working)
      .filter(([k, f]) => k.toLowerCase().includes(q) || String(f.value).toLowerCase().includes(q))
      .map(([k, f]) => ({ key: k, value: f.value, source: f.source, updatedAt: f.updatedAt }));
    return { status: "ok" as const, matches };
  }

  return { remember, recall, ops };
}
