/**
 * Wires up the IT Helpdesk Copilot's eight tools into a ToolRegistry: the
 * six read tools from tools.ts, plus remember/recall bound to this
 * request's memory blob (see memory.ts). Direct equivalent of SkyVault's
 * mcp_server.py build_default_registry() - the one difference is that
 * memory tools need per-request state (the client's localStorage blob),
 * so this is a function of `initialMemory` rather than a fixed singleton.
 */

import { ToolRegistry } from "@/lib/mcp/registry";
import { RECALL_SCHEMA, REMEMBER_SCHEMA, TOOL_SCHEMAS } from "./schemas";
import { createMemoryTools, type MemoryStore } from "./memory";
import {
  checkSystemStatus,
  checkUserAccess,
  escalateTicket,
  findTicketsForEmployee,
  getTicketStatus,
  searchKnowledgeBase,
} from "./tools";

export function buildRegistryForRequest(initialMemory: MemoryStore) {
  const registry = new ToolRegistry();
  const memoryTools = createMemoryTools(initialMemory);

  const toolFunctions: Record<string, (args: Record<string, unknown>) => Record<string, unknown>> = {
    get_ticket_status: getTicketStatus as never,
    search_knowledge_base: searchKnowledgeBase as never,
    check_system_status: checkSystemStatus as never,
    find_tickets_for_employee: findTicketsForEmployee as never,
    check_user_access: checkUserAccess as never,
    escalate_ticket: escalateTicket as never,
    remember: memoryTools.remember as never,
    recall: memoryTools.recall as never,
  };

  for (const schema of [...TOOL_SCHEMAS, REMEMBER_SCHEMA, RECALL_SCHEMA]) {
    registry.register(schema.name, toolFunctions[schema.name], schema.description, schema.input_schema);
  }

  return { registry, memoryOps: memoryTools.ops };
}
