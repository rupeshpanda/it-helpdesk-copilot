import type { TraceStep } from "@/lib/agent/run";

/**
 * Turns one tool call into a short line for the chat, such as "Checked
 * status of ticket INC0048213". The raw JSON stays in the MCP panel. This
 * is the plain version, shown where the work happened.
 */
export function describeToolCall(step: TraceStep): string {
  const a = step.arguments as Record<string, string>;
  const ok = step.result.status === "ok";

  switch (step.tool) {
    case "get_ticket_status":
      return ok
        ? `Checked status of ticket ${a.ticket_id}`
        : `Could not find ticket ${a.ticket_id}`;
    case "find_tickets_for_employee":
      return ok
        ? `Looked up tickets for employee ${a.employee_id}`
        : `Could not find employee ${a.employee_id}`;
    case "search_knowledge_base":
      return `Searched the knowledge base for "${a.query}"`;
    case "check_system_status":
      return ok
        ? `Checked status of ${a.system_name}`
        : `Did not recognise the system ${a.system_name}`;
    case "check_user_access":
      return ok
        ? `Checked access for employee ${a.employee_id}`
        : `Could not find employee ${a.employee_id}`;
    case "escalate_ticket":
      return ok
        ? `Escalated ticket ${a.ticket_id} to ${a.team}`
        : `Could not escalate ticket ${a.ticket_id}`;
    case "remember":
      return `Remembered ${a.key}: ${a.value}`;
    case "recall":
      return `Searched memory for "${a.query}"`;
    default:
      return `Called ${step.tool}`;
  }
}
