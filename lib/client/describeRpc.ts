import type { RpcLogEntry } from "@/lib/mcp/client";

/** One JSON-RPC exchange plus which program made it, so the trace can show
 * the Copilot and a second program side by side. */
export type TraceEntry = RpcLogEntry & { consumer: string };

export interface RpcDescription {
  title: string;
  detail?: string;
  toolNames?: string[];
  tone: "ok" | "error" | "info";
}

/** One short line per exchange. The raw JSON stays available underneath. */
export function describeRpc(entry: RpcLogEntry): RpcDescription {
  const { request, response } = entry;
  const params = (request.params ?? {}) as Record<string, unknown>;

  if (response.error) {
    return { title: `Refused: ${response.error.message}`, tone: "error" };
  }

  if (request.method === "initialize") {
    return { title: "Connected to the tool server", tone: "info" };
  }

  if (request.method === "tools/list") {
    const result = (response.result ?? {}) as { tools?: { name: string }[] };
    const names = (result.tools ?? []).map((t) => t.name);
    return { title: `Found ${names.length} tools`, toolNames: names, tone: "info" };
  }

  if (request.method === "tools/call") {
    const name = String(params.name ?? "tool");
    const result = (response.result ?? {}) as { status?: string; message?: string };
    if (result.status === "error") {
      return { title: `${name} failed`, detail: result.message, tone: "error" };
    }
    return { title: `Ran ${name}`, tone: "ok" };
  }

  return { title: request.method, tone: "info" };
}
