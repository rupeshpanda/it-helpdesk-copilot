import type { RpcLogEntry } from "@/lib/mcp/client";

/** One JSON-RPC exchange plus which program made it, so the trace panel can
 * show the Copilot agent and a second consumer side by side. */
export type TraceEntry = RpcLogEntry & { consumer: string };

export interface RpcDescription {
  title: string;
  detail: string;
  toolNames?: string[];
  tone: "ok" | "error" | "info";
}

/**
 * Turns a raw JSON-RPC request/response pair into a sentence a reader who
 * has never seen the protocol can follow. The raw JSON stays available
 * underneath; this is the layer that says what each message was for.
 */
export function describeRpc(entry: RpcLogEntry): RpcDescription {
  const { request, response } = entry;
  const params = (request.params ?? {}) as Record<string, unknown>;

  if (response.error) {
    return {
      title: `Server refused: ${request.method}`,
      detail: `${response.error.message} (code ${response.error.code})`,
      tone: "error",
    };
  }

  if (request.method === "initialize") {
    const clientInfo = (params.clientInfo ?? {}) as { name?: string };
    const result = (response.result ?? {}) as {
      serverInfo?: { name?: string };
      protocolVersion?: string;
    };
    return {
      title: "Handshake",
      detail: `${clientInfo.name ?? "client"} introduced itself to ${
        result.serverInfo?.name ?? "the server"
      } and agreed protocol version ${result.protocolVersion ?? "?"}.`,
      tone: "info",
    };
  }

  if (request.method === "tools/list") {
    const result = (response.result ?? {}) as { tools?: { name: string }[] };
    const names = (result.tools ?? []).map((t) => t.name);
    return {
      title: `Asked the server what it can do: ${names.length} tools`,
      detail: "The server answered with a name, a description, and an argument schema for each.",
      toolNames: names,
      tone: "info",
    };
  }

  if (request.method === "tools/call") {
    const name = String(params.name ?? "tool");
    const args = (params.arguments ?? {}) as Record<string, unknown>;
    const argText = Object.entries(args)
      .map(([k, v]) => `${k} = ${String(v)}`)
      .join(", ");
    const result = (response.result ?? {}) as { status?: string; message?: string };
    const failed = result.status === "error";
    return {
      title: `Ran ${name}`,
      detail: failed
        ? `Arguments: ${argText}. The tool reported a problem: ${result.message ?? "unknown"}.`
        : `Arguments: ${argText}. The tool returned a result.`,
      tone: failed ? "error" : "ok",
    };
  }

  return { title: request.method, detail: "", tone: "info" };
}
