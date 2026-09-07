import { NextResponse } from "next/server";
import { buildRegistryForRequest } from "@/lib/agent/registry";
import { MCPClient } from "@/lib/mcp/client";
import { MCPServer } from "@/lib/mcp/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * A second consumer of the same tools, with no language model involved.
 *
 * This is the site's equivalent of SkyVault's gatebot.py: a different
 * program, identifying itself under a different client name, reaching the
 * same MCPServer through the same three messages (initialize, tools/list,
 * tools/call). It exists to make the enterprise argument for MCP visible
 * rather than asserted. The Copilot agent and this bot never share code
 * beyond the client, yet the trace panel shows identical message shapes.
 *
 * No model call happens here, so the only cost is CPU. It shares the chat
 * endpoint's per-IP rate limit purely so a held-down button cannot spin.
 */

const ALLOWED_SYSTEMS = ["SAP ECC", "SAP S/4HANA", "SAP Concur", "SAP SuccessFactors", "SAP Ariba"];

export async function POST(req: Request) {
  const limit = rateLimit(clientIp(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let system = "SAP S/4HANA";
  try {
    const body = (await req.json().catch(() => ({}))) as { system?: unknown };
    if (typeof body.system === "string" && ALLOWED_SYSTEMS.includes(body.system)) {
      system = body.system;
    }
  } catch {
    // no body is fine
  }

  // Same registry, same server class, a different client identity. This bot
  // has no memory of its own, so it hands the registry an empty store.
  const { registry } = buildRegistryForRequest({});
  const client = new MCPClient(new MCPServer(registry), "SystemStatusBot", "0.1.0");

  const tools = client.listTools();
  const result = client.callTool("check_system_status", { system_name: system });

  return NextResponse.json({
    consumer: "SystemStatusBot",
    toolsAvailable: tools.length,
    result,
    mcpLog: client.log,
  });
}
