/**
 * What the no-tools column actually did, worked out from the answer it just
 * produced rather than assumed in advance.
 *
 * Without tools the model usually invents the ticket: a different requester,
 * a different system, a knowledge base article that does not exist, and a
 * confident summary of all of it. Sometimes it declines instead. Both are
 * worth seeing, and the page must not claim the one that did not happen.
 */

/** Facts that are actually true of INC0048255. */
const TRUE_TOKENS = ["david chen", "dchen07", "concur", "san jose"];

const REFUSAL_HINTS = [
  "do not have access",
  "don't have access",
  "cannot access",
  "can't access",
  "no access",
  "unable to access",
  "i cannot retrieve",
  "i don't have the ability",
  "would need access",
];

export type NoToolsVerdict =
  | { kind: "fabricated"; line: string }
  | { kind: "declined"; line: string }
  | { kind: "partial"; line: string };

export function judgeNoTools(answer: string): NoToolsVerdict {
  const a = answer.toLowerCase();
  const hits = TRUE_TOKENS.filter((t) => a.includes(t));
  const refused = REFUSAL_HINTS.some((h) => a.includes(h));

  if (refused && hits.length === 0) {
    return {
      kind: "declined",
      line: "This time it admitted it cannot reach the ticket system. Honest, and no use to the person waiting.",
    };
  }

  if (hits.length === 0) {
    return {
      kind: "fabricated",
      line: "Every detail above is invented. It named a requester, a system and a fix that are not in this ticket, and formatted them like a finished answer.",
    };
  }

  return {
    kind: "partial",
    line: "It produced an answer without looking anything up, so whatever is right in it is a guess that happened to land.",
  };
}
