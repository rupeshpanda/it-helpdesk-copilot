import type { TraceStep } from "@/lib/agent/run";

/**
 * Turns one tool call from the trace into a short, human-readable line for
 * inline display in the chat - e.g. "Checked status of ticket INC0048213".
 * Keeps the raw JSON-RPC detail in the MCP trace panel; this is the plain-
 * language version shown right where the reasoning happened.
 */
export function describeToolCall(step: TraceStep): string {
  const a = step.arguments as Record<string, string>;
  const ok = step.result.status === "ok";

  switch (step.tool) {
    case "get_ticket_status":
      return ok
        ? `Checked status of ticket ${a.ticket_id}`
        : `Looked for ticket ${a.ticket_id} - not found`;
    case "find_tickets_for_employee":
      return ok
        ? `Looked up tickets for employee ${a.employee_id}`
        : `Looked up tickets for ${a.employee_id} - employee not found`;
    case "search_knowledge_base":
      return `Searched the knowledge base for "${a.query}"`;
    case "check_system_status":
      return ok
        ? `Checked status of ${a.system_name}`
        : `Checked status of ${a.system_name} - system not recognised`;
    case "check_user_access":
      return ok
        ? `Checked access details for employee ${a.employee_id}`
        : `Checked access for ${a.employee_id} - employee not found`;
    case "escalate_ticket":
      return ok
        ? `Escalated ticket ${a.ticket_id} to ${a.team}`
        : `Tried to escalate ${a.ticket_id} - failed`;
    case "remember":
      return `Remembered ${a.key}: ${a.value}`;
    case "recall":
      return `Searched memory for "${a.query}"`;
    default:
      return `Called ${step.tool}`;
  }
}
