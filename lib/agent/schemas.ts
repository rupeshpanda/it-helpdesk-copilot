/**
 * Tool declarations - name, description, and a JSON Schema of the
 * parameters - the same role schemas.py played in SkyVault. The model never
 * sees tools.ts. It only ever sees these declarations, so the description
 * fields are the entire interface it reasons over when deciding which
 * function to call and with what arguments.
 */

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: "get_ticket_status",
    description:
      "Returns the status (open/in_progress/escalated/resolved/closed), priority (P1-P4), " +
      "assigned SAP Basis team, affected system, and description for a specific incident " +
      "ticket, identified by its ticket ID (e.g. 'INC0012345'). Use this to answer questions " +
      "about a specific ticket's current state.",
    input_schema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "Incident ticket ID, e.g. 'INC0012345'" },
      },
      required: ["ticket_id"],
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Searches the IT knowledge base for articles matching a query - covers SAP GUI/VPN " +
      "connectivity, T-code authorization requests, password resets, and Concur workflow " +
      "issues. Use this before escalating a ticket, in case a known fix already exists.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text, e.g. 'vpn connection' or 'password reset'" },
      },
      required: ["query"],
    },
  },
  {
    name: "check_system_status",
    description:
      "Returns whether a specific SAP system (e.g. 'SAP ECC', 'SAP S/4HANA', 'SAP Concur', " +
      "'SAP SuccessFactors', 'SAP Ariba') is operational, degraded, or down, plus any related " +
      "open incident. Use this when a ticket or question might be caused by a broader outage " +
      "rather than a user-specific issue.",
    input_schema: {
      type: "object",
      properties: {
        system_name: { type: "string", description: "SAP system name, e.g. 'SAP S/4HANA'" },
      },
      required: ["system_name"],
    },
  },
  {
    name: "find_tickets_for_employee",
    description:
      "Returns every ticket currently on file for a given employee ID, with each ticket's " +
      "status, priority, and description, but not its assigned team. Use this whenever a " +
      "request refers to 'my ticket(s)' or an employee's ticket without giving a specific " +
      "ticket ID directly - never guess a ticket ID.",
    input_schema: {
      type: "object",
      properties: {
        employee_id: { type: "string", description: "Employee ID, e.g. 'jsmith02'" },
      },
      required: ["employee_id"],
    },
  },
  {
    name: "check_user_access",
    description:
      "Returns an employee's department, US office location, and SAP authorization role for " +
      "a given employee ID (e.g. 'jsmith02'). Use this to confirm who a ticket belongs to or " +
      "whether their role should already have the access they are asking about.",
    input_schema: {
      type: "object",
      properties: {
        employee_id: { type: "string", description: "Employee ID, e.g. 'jsmith02'" },
      },
      required: ["employee_id"],
    },
  },
  {
    name: "escalate_ticket",
    description:
      "Escalates an existing ticket to a specific team (e.g. 'SAP Basis - Central', 'SAP " +
      "Basis - West', 'SAP Basis - East'). Use this only after confirming the ticket exists " +
      "and a knowledge-base fix does not already resolve it. This is a simulated write for " +
      "this demo and is not persisted to a real ticketing system.",
    input_schema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "Incident ticket ID, e.g. 'INC0012345'" },
        team: { type: "string", description: "Team to escalate to, e.g. 'SAP Basis - Central'" },
      },
      required: ["ticket_id", "team"],
    },
  },
];

export const REMEMBER_SCHEMA: ToolSchema = {
  name: "remember",
  description:
    "Persistently stores a fact so it can be recalled in a FUTURE session, not just later in " +
    "this same conversation - use this whenever the user states a preference or fact worth " +
    "keeping (e.g. 'always route my tickets to the Austin Basis team'), even if they do not " +
    "explicitly ask you to save it. `key` should be a short snake_case identifier (e.g. " +
    "'preferred_team'), `value` is the fact's content, and `source` is who stated it. Storing " +
    "a fact under a key that already exists overwrites the old value.",
  input_schema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Short snake_case identifier, e.g. 'preferred_team'" },
      value: { type: "string", description: "The fact to store, e.g. 'SAP Basis - Central'" },
      source: { type: "string", description: "Who stated this fact, e.g. 'user'. Defaults to 'user'." },
    },
    required: ["key", "value"],
  },
};

export const RECALL_SCHEMA: ToolSchema = {
  name: "recall",
  description:
    "Searches persistent memory for facts matching a query string. A summary of all stored " +
    "facts is already loaded into your context at the start of every session, so you rarely " +
    "need this mid-conversation - use it only to double-check a specific fact.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Text to search for among stored fact keys and values" },
    },
    required: ["query"],
  },
};

export const SYSTEM_PROMPT =
  "You are the IT Helpdesk Copilot for a USA-based enterprise running SAP. You have tools " +
  "that read live ticket, system-health, employee, and knowledge-base data, plus " +
  "remember/recall tools for facts that persist across sessions. Always use tools to ground " +
  "your answers in current data rather than guessing - in particular, never guess or assume a " +
  "ticket ID; if a request refers to 'my ticket' without stating one, call " +
  "find_tickets_for_employee first. Before escalating a ticket, check the " +
  "knowledge base first in case a known fix already applies. If the user states a preference " +
  "or fact worth keeping for future sessions, call remember to store it, even if they do not " +
  "explicitly ask you to. If a tool returns {\"status\": \"error\", ...}, explain the failure " +
  "to the user in plain language rather than making up an answer.";
