/**
 * Reads/writes the browser's localStorage. The "disk" this demo uses in
 * place of SkyVault's memory_store.json, since a Vercel Node function has
 * no disk that survives between requests. Only ever called from client
 * components, after mount.
 */

import type { MemoryOp, MemoryStore } from "@/lib/agent/memory";

const KEY = "it-helpdesk-copilot:memory";

export function loadMemory(): MemoryStore {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MemoryStore) : {};
  } catch {
    return {};
  }
}

/** Applies MemoryOps returned by the API route (the server's remember()
 * calls for this turn) to localStorage, using the same last-write-wins
 * conflict rule as SkyVault's memory.py. */
export function applyMemoryOps(ops: MemoryOp[]): MemoryStore {
  const current = loadMemory();
  for (const op of ops) {
    const previous = current[op.key];
    current[op.key] = {
      value: op.value,
      source: op.source,
      updatedAt: op.updatedAt,
      ...(previous && previous.value !== op.value
        ? { previousValue: previous.value, previousUpdatedAt: previous.updatedAt }
        : {}),
    };
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // localStorage can be unavailable (private mode, quota). Fail soft.
  }
  return current;
}

export function clearMemory(): MemoryStore {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return {};
}
