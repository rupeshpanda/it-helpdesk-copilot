import type { MemoryStore } from "./memory";

/**
 * The three ways the same ticket gets worked. One model, one question, one
 * set of data. What changes between columns is what the agent is allowed to
 * reach, and what it has been told to remember.
 */

export const TICKET_ID = "INC0048255";

export const TASK =
  `Work ticket ${TICKET_ID}. Check who raised it, whether the system is healthy, and whether a ` +
  "known fix applies. Then tell me what should happen, and escalate it to the right team if that " +
  "is the right call.";

export const POLICY_TEXT =
  "All tickets raised from California offices go to SAP Basis - East, whatever team the ticket " +
  "is currently assigned to.";

const POLICY_MEMORY: MemoryStore = {
  routing_policy_california: {
    value: POLICY_TEXT,
    source: "service desk lead",
    updatedAt: "2026-09-01T09:00:00.000Z",
  },
};

export type VariantKey = "none" | "tools" | "memory";

export const VARIANTS: Record<
  VariantKey,
  { title: string; setup: string; withTools: boolean; memory: MemoryStore }
> = {
  none: {
    title: "No tools",
    setup: "The model on its own.",
    withTools: false,
    memory: {},
  },
  tools: {
    title: "Tools",
    setup: "Eight tools, nothing remembered.",
    withTools: true,
    memory: {},
  },
  memory: {
    title: "Tools and memory",
    setup: "The same eight tools, plus one standing instruction.",
    withTools: true,
    memory: POLICY_MEMORY,
  },
};
