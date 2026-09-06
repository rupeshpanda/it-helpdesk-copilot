/**
 * The actual actions the IT Helpdesk Copilot can take. Plain functions that
 * read data.ts and return { status: "ok", ... } or { status: "error",
 * message }, mirroring the Python tools.py convention from SkyVault - no LLM
 * code in this file, no MCP code either. These are wrapped by an MCP
 * ToolRegistry (lib/mcp/registry.ts), never called directly by the agent loop.
 */

import { EMPLOYEES, KB_ARTICLES, SYSTEMS, TICKETS } from "./data";

export type ToolResult = { status: "ok" | "error"; [key: string]: unknown };

export function getTicketStatus(args: { ticket_id: string }): ToolResult {
  const ticket = TICKETS[args.ticket_id?.toUpperCase()];
  if (!ticket) {
    return { status: "error", message: `No ticket found with ID '${args.ticket_id}'` };
  }
  return {
    status: "ok",
    ticketId: ticket.ticketId,
    ticketStatus: ticket.status,
    priority: ticket.priority,
    system: ticket.system,
    assignedTeam: ticket.assignedTeam,
    description: ticket.description,
    createdAt: ticket.createdAt,
  };
}

export function searchKnowledgeBase(args: { query: string }): ToolResult {
  const q = (args.query ?? "").toLowerCase();
  const matches = KB_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q) ||
      a.tags.some((t) => t.includes(q) || q.includes(t)),
  );
  return {
    status: "ok",
    matches: matches.map((a) => ({ articleId: a.articleId, title: a.title, body: a.body })),
  };
}

/** SYSTEMS is keyed by a lowercase alias; a user or the model may phrase a
 * system name in several ways ("S/4", "SAP S4HANA", "successfactors"), so
 * this normalizes to the closest known key rather than requiring an exact
 * match - the same kind of normalization find_available_gate needed in the
 * Python version for "Terminal 2" vs "T2". */
function normalizeSystemName(input: string): string | null {
  const q = input.toLowerCase().trim();
  const candidates = Object.keys(SYSTEMS);
  const exact = candidates.find((c) => c === q);
  if (exact) return exact;
  const contains = candidates.find((c) => q.includes(c) || c.includes(q.replace("sap ", "")));
  if (contains) return contains;
  if (q.includes("s/4") || q.includes("s4")) return "sap s/4hana";
  if (q.includes("ecc")) return "sap ecc";
  if (q.includes("concur")) return "sap concur";
  if (q.includes("successfactors") || q.includes("sfsf")) return "sap successfactors";
  if (q.includes("ariba")) return "sap ariba";
  return null;
}

export function checkSystemStatus(args: { system_name: string }): ToolResult {
  const key = normalizeSystemName(args.system_name ?? "");
  if (!key) {
    return { status: "error", message: `No system found matching '${args.system_name}'` };
  }
  const health = SYSTEMS[key];
  return {
    status: "ok",
    system: health.system,
    systemStatus: health.status,
    lastIncident: health.lastIncident,
    note: health.note,
  };
}

/**
 * Without this, "escalate MY open ticket" has no honest way to resolve a
 * ticket ID from an employee ID - the model would have nothing to go on but
 * a guess (and a guess that happens to match the schema's own illustrative
 * example is not evidence of real tool-driven behaviour, just a coincidence
 * worth avoiding by design).
 */
export function findTicketsForEmployee(args: { employee_id: string }): ToolResult {
  if (!EMPLOYEES[args.employee_id]) {
    return { status: "error", message: `No employee found with ID '${args.employee_id}'` };
  }
  const tickets = Object.values(TICKETS).filter((t) => t.employeeId === args.employee_id);
  return {
    status: "ok",
    employeeId: args.employee_id,
    tickets: tickets.map((t) => ({
      ticketId: t.ticketId,
      status: t.status,
      priority: t.priority,
      description: t.description,
    })),
  };
}

export function checkUserAccess(args: { employee_id: string }): ToolResult {
  const employee = EMPLOYEES[args.employee_id];
  if (!employee) {
    return { status: "error", message: `No employee found with ID '${args.employee_id}'` };
  }
  return {
    status: "ok",
    employeeId: employee.employeeId,
    name: employee.name,
    department: employee.department,
    location: employee.location,
    sapRole: employee.sapRole,
  };
}

/**
 * Simulated write: this demo runs on a stateless serverless function with no
 * database, so escalation is not actually persisted between requests. That
 * is stated plainly here and in the UI rather than faked - the point of the
 * demo is tool calling and MCP, not a real ticketing backend.
 */
export function escalateTicket(args: { ticket_id: string; team: string }): ToolResult {
  const ticket = TICKETS[args.ticket_id?.toUpperCase()];
  if (!ticket) {
    return { status: "error", message: `No ticket found with ID '${args.ticket_id}'` };
  }
  return {
    status: "ok",
    ticketId: ticket.ticketId,
    escalatedTo: args.team,
    note: "Escalation simulated for this demo session - not persisted to a real ticket system.",
  };
}
