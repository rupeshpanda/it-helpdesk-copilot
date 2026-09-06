# IT Helpdesk Copilot

An Elegance AI lab. A live, chat-based AI Operations Copilot for a fictional
USA-based company running SAP, built to make three concepts visible while
they happen rather than merely described: tool calling, persistent memory,
and the Model Context Protocol (MCP).

Live demo: `/lab/it-helpdesk-copilot` · Concepts guide: `/guide`

## What this is

Every reply in the demo is a live call to `claude-sonnet-4-5`, deciding which
of eight tools to use and with what arguments. Nothing is scripted. The demo
is deliberately built with **no MCP SDK** - the JSON-RPC-shaped
`initialize` / `tools/list` / `tools/call` message lifecycle is hand-rolled
TypeScript, so the mechanics MCP standardises are visible in the code rather
than hidden behind a library.

## Architecture

| Path | Responsibility |
|---|---|
| `lib/agent/data.ts` | Mock SAP data: tickets, employees, system health, knowledge base. |
| `lib/agent/tools.ts` | Six plain functions reading that data, each returning `{status: "ok"/"error", ...}`. |
| `lib/agent/memory.ts` | `remember`/`recall` executed against a request-scoped memory blob, plus the context-summary builder folded into the system prompt. |
| `lib/agent/schemas.ts` | Tool declarations (name/description/JSON Schema) - the only interface the model sees. |
| `lib/agent/registry.ts` | Wires the six data tools plus `remember`/`recall` into an MCP `ToolRegistry` for one request. |
| `lib/agent/run.ts` | The agent loop (the MCP Host): ask, receive a tool request, call it through the MCP client, feed the result back, repeat. |
| `lib/mcp/registry.ts` | `ToolRegistry` - name/description/schema/function, nothing about JSON-RPC. |
| `lib/mcp/server.ts` | `MCPServer` - the protocol boundary: `initialize`, `tools/list`, `tools/call`, JSON-RPC error objects for bad requests. |
| `lib/mcp/client.ts` | `MCPClient` - the only thing the agent loop is allowed to call; logs every request/response pair. |
| `app/api/lab/it-helpdesk-copilot/chat/route.ts` | The one API route: rate limiting, input caps, a relevance gate, then `runAgent()`. |
| `lib/client/memoryStorage.ts` | Reads/writes the browser's `localStorage` - the "disk" this demo uses in place of a server-side database. |
| `components/HelpdeskDemo.tsx` | Owns chat/memory/trace state; the only client component that calls the API. |
| `components/ChatPanel.tsx`, `MemoryPanel.tsx`, `McpTracePanel.tsx` | The three panels: chat, stored facts, and the live JSON-RPC trace. |

## Why memory lives in the browser, not a database

A Vercel Node function is stateless between requests, so there is no disk to
write `remember()` calls to the way a long-running Python process could.
Instead, the browser is the durable store: each chat request sends the
client's current memory facts (read from `localStorage`) to the server,
which folds them into the system prompt and executes any `remember`/`recall`
calls against that blob for the current turn. Any writes come back as
`memoryOps`, which the client applies to `localStorage` after the response
lands. "Restart" in this demo means reloading the page or returning later in
the same browser - an honest instance of the same persistence concept, with
no new infrastructure.

**Conflict rule:** same key overwrites the old value, last write wins. The
previous value is kept only as an audit trail on the record, never surfaced
back to the model or the user as a live alternative.

## Local setup

```
npm install
cp .env.example .env.local
# add your ANTHROPIC_API_KEY
npm run dev
```

## Cost and abuse controls

Same posture as the sibling lab `good-tools-bad-tools`: an in-memory,
per-IP rate limit (`lib/rateLimit.ts`), a per-message length cap, a
total-conversation-length cap, a memory-blob size cap, and a keyword-based
relevance gate rejecting off-topic messages before spending a model call.
These are cost controls, not a security boundary.

## Disclaimer

Synthetic data only. No real company, employee, or SAP system status is
represented. SAP product names (ECC, S/4HANA, Concur, SuccessFactors, Ariba)
are used descriptively for a fictional demo scenario and are trademarks of
SAP SE. This project is not affiliated with or endorsed by SAP.
