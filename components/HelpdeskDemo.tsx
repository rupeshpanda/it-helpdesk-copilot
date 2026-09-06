"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { MemoryPanel } from "./MemoryPanel";
import { McpTracePanel } from "./McpTracePanel";
import { applyMemoryOps, loadMemory } from "@/lib/client/memoryStorage";
import type { ChatTurn } from "@/lib/agent/run";
import type { MemoryStore } from "@/lib/agent/memory";
import type { RpcLogEntry } from "@/lib/mcp/client";

interface ChatResponse {
  reply: string;
  mcpLog: RpcLogEntry[];
  error?: string;
}

export function HelpdeskDemo() {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [memory, setMemory] = useState<MemoryStore>({});
  const [mcpLog, setMcpLog] = useState<RpcLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memory is loaded from localStorage only after mount - reading it during
  // server rendering would either throw (no `window`) or silently diverge
  // from what the browser actually has.
  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  async function handleSend(text: string) {
    setError(null);
    const nextMessages: ChatTurn[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/lab/it-helpdesk-copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, memory }),
      });
      const data = (await res.json()) as ChatResponse & { memoryOps?: Parameters<typeof applyMemoryOps>[0] };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setMcpLog(data.mcpLog ?? []);
      if (data.memoryOps && data.memoryOps.length > 0) {
        setMemory(applyMemoryOps(data.memoryOps));
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Could not reach the Copilot. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewSession() {
    setMessages([]);
    setMcpLog([]);
    setError(null);
    // Deliberately NOT clearing memory - that persistence across a "new
    // session" is the entire point of this demo.
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <ChatPanel
        messages={messages}
        onSend={handleSend}
        onNewSession={handleNewSession}
        loading={loading}
        error={error}
      />
      <div className="flex flex-col gap-5">
        <MemoryPanel memory={memory} />
        <McpTracePanel log={mcpLog} />
      </div>
    </div>
  );
}
