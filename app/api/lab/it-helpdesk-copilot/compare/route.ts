import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/run";
import { TASK, VARIANTS, type VariantKey } from "@/lib/agent/variants";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Runs the same ticket under one of three configurations and returns the
 * transcript. The page fires all three at once so each column fills as its
 * own run finishes rather than waiting on the slowest.
 *
 * Nothing here can change anything. If the agent decides the ticket should
 * be escalated, the loop stops at the proposal and the proposal is what the
 * column reports. That is the same approval boundary the agent always has,
 * used here as the thing being compared.
 */
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
      { error: `That is a lot of runs in a short time. Try again in ${limit.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let variant: unknown;
  try {
    ({ variant } = await req.json());
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (variant !== "none" && variant !== "tools" && variant !== "memory") {
    return NextResponse.json({ error: "Unknown variant." }, { status: 400 });
  }

  const config = VARIANTS[variant as VariantKey];
  const started = Date.now();

  try {
    const result = await runAgent(
      [{ role: "user", content: TASK }],
      config.memory,
      apiKey,
      undefined,
      config.withTools,
    );

    return NextResponse.json({
      variant,
      answer: result.reply,
      tools: result.trace,
      proposal: result.pending?.summary ?? null,
      mcpLog: result.mcpLog,
      elapsedMs: Date.now() - started,
    });
  } catch (e) {
    console.error("comparison run failed", e);
    return NextResponse.json(
      { error: "The model call failed. Try again in a moment." },
      { status: 502 },
    );
  }
}
