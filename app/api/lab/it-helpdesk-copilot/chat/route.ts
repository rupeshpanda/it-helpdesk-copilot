import { NextResponse } from "next/server";
import { runAgent, type ChatTurn, type Resume } from "@/lib/agent/run";
import type { MemoryStore } from "@/lib/agent/memory";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGE_CHARS = 400;
const MAX_HISTORY_MESSAGES = 16;
const MAX_MEMORY_JSON_CHARS = 5_000;
const MAX_RESUME_JSON_CHARS = 100_000;

/**
 * A crude relevance gate, same spirit as good-tools-bad-tools' looksRelevant().
 * This endpoint is a public button that spends the site owner's API budget,
 * so it only answers messages that plausibly concern the fictional SAP
 * helpdesk it has tools for. A cost control, not a security boundary.
 */
const DOMAIN_HINTS = [
  "ticket", "inc00", "sap", "ecc", "s/4", "s4hana", "concur", "successfactors",
  "ariba", "vpn", "gui", "password", "reset", "lockout", "t-code", "tcode",
  "authorization", "access", "role", "escalate", "basis", "workflow",
  "approval", "expense", "purchase", "requisition", "outage", "down",
  "degraded", "status", "employee", "jsmith", "rodriguez", "chen", "whitfield",
  "remember", "recall", "terminal", "team", "helpdesk", "hi", "hello", "help",
  // Memory and identity questions. These must reach the model even before
  // anything is stored, because "nothing found" is itself a useful answer.
  "my name", "who am i", "what do you know", "know about me", "my id",
  "my preference", "my department", "my location", "forget",
];

function looksRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return DOMAIN_HINTS.some((hint) => lower.includes(hint));
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The live demo is not configured on this deployment." },
      { status: 503 },
    );
  }

  const limit = rateLimit(clientIp(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `That is a lot of messages in a short time. Try again in ${limit.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { messages, memory, resume } = (body ?? {}) as {
    messages?: unknown;
    memory?: unknown;
    resume?: unknown;
  };

  // A decision on a paused action: the state came from this endpoint, and
  // goes straight back to it. Only the boolean is trusted as intent.
  let resumeArg: Resume | undefined;
  if (resume && typeof resume === "object") {
    const r = resume as { state?: unknown; approved?: unknown };
    if (!Array.isArray(r.state) || typeof r.approved !== "boolean") {
      return NextResponse.json({ error: "Malformed decision." }, { status: 400 });
    }
    if (JSON.stringify(r.state).length > MAX_RESUME_JSON_CHARS) {
      return NextResponse.json({ error: "That conversation is too large to resume." }, { status: 400 });
    }
    resumeArg = { state: r.state, approved: r.approved };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Send at least one message." }, { status: 400 });
  }
  if (messages.length > MAX_HISTORY_MESSAGES) {
    return NextResponse.json(
      { error: "This conversation is long for a demo. Start a new session." },
      { status: 400 },
    );
  }

  const history: ChatTurn[] = [];
  for (const m of messages) {
    if (
      typeof m !== "object" ||
      m === null ||
      (m as ChatTurn).role !== "user" && (m as ChatTurn).role !== "assistant" ||
      typeof (m as ChatTurn).content !== "string"
    ) {
      return NextResponse.json({ error: "Malformed message in history." }, { status: 400 });
    }
    const content = (m as ChatTurn).content.trim().slice(0, MAX_MESSAGE_CHARS);
    history.push({ role: (m as ChatTurn).role, content });
  }

  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  if (!lastUserMessage || !lastUserMessage.content) {
    return NextResponse.json({ error: "Ask something first." }, { status: 400 });
  }
  // A decision carries no new question, so the gate does not apply to it.
  if (!resumeArg && !looksRelevant(lastUserMessage.content)) {
    return NextResponse.json(
      {
        error:
          "This Copilot only has tools for one fictional SAP helpdesk: tickets, system " +
          "status, employee access, and knowledge-base lookups. Try asking about one of those.",
      },
      { status: 400 },
    );
  }

  let memoryStore: MemoryStore = {};
  if (memory && typeof memory === "object") {
    if (JSON.stringify(memory).length > MAX_MEMORY_JSON_CHARS) {
      return NextResponse.json({ error: "Stored memory is too large for this demo." }, { status: 400 });
    }
    memoryStore = memory as MemoryStore;
  }

  try {
    const result = await runAgent(history, memoryStore, apiKey, resumeArg);
    return NextResponse.json(result);
  } catch (e) {
    console.error("agent run failed", e);
    return NextResponse.json({ error: "The model call failed. Try again in a moment." }, { status: 502 });
  }
}
