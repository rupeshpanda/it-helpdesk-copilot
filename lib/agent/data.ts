/**
 * Mock "databases" for the IT Helpdesk Copilot. Plain objects standing in
 * for a USA-based enterprise's SAP landscape: an incident/ticket system, an
 * employee directory, system status, and a knowledge base. Synthetic data
 * only - no real company, employee, or SAP system status is represented.
 */

export interface Employee {
  employeeId: string;
  name: string;
  department: string;
  location: string;
  sapRole: string;
}

export const EMPLOYEES: Record<string, Employee> = {
  jsmith02: {
    employeeId: "jsmith02",
    name: "John Smith",
    department: "Finance",
    location: "Austin, TX",
    sapRole: "FI_ANALYST",
  },
  mrodriguez14: {
    employeeId: "mrodriguez14",
    name: "Maria Rodriguez",
    department: "Procurement",
    location: "Chicago, IL",
    sapRole: "MM_BUYER",
  },
  dchen07: {
    employeeId: "dchen07",
    name: "David Chen",
    department: "HR",
    location: "San Jose, CA",
    sapRole: "HR_ADMIN",
  },
  awhitfield21: {
    employeeId: "awhitfield21",
    name: "Amanda Whitfield",
    department: "Sales",
    location: "Atlanta, GA",
    sapRole: "SD_REP",
  },
};

export type TicketPriority = "P1" | "P2" | "P3" | "P4";
export type TicketStatus = "open" | "in_progress" | "escalated" | "resolved" | "closed";

export interface Ticket {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  system: string;
  assignedTeam: string;
  employeeId: string;
  description: string;
  createdAt: string;
}

export const TICKETS: Record<string, Ticket> = {
  INC0048213: {
    ticketId: "INC0048213",
    status: "open",
    priority: "P3",
    system: "SAP ECC (Production)",
    assignedTeam: "SAP Basis - Central",
    employeeId: "jsmith02",
    description: "User unable to post a journal entry - authorization error on FB50.",
    createdAt: "2026-09-02T14:12:00-05:00",
  },
  INC0048227: {
    ticketId: "INC0048227",
    status: "in_progress",
    priority: "P2",
    system: "SAP S/4HANA",
    assignedTeam: "SAP Basis - Central",
    employeeId: "mrodriguez14",
    description: "Purchase requisition workflow stuck in approval step 2.",
    createdAt: "2026-09-03T09:47:00-06:00",
  },
  INC0048255: {
    ticketId: "INC0048255",
    status: "open",
    priority: "P4",
    system: "SAP Concur",
    assignedTeam: "SAP Basis - West",
    employeeId: "dchen07",
    description: "Expense report submitted twice by mistake, needs one voided.",
    createdAt: "2026-09-04T11:05:00-07:00",
  },
  INC0048301: {
    ticketId: "INC0048301",
    status: "resolved",
    priority: "P1",
    system: "SAP SuccessFactors",
    assignedTeam: "SAP Basis - East",
    employeeId: "awhitfield21",
    description: "SuccessFactors login outage affecting entire Atlanta office.",
    createdAt: "2026-09-01T08:30:00-04:00",
  },
};

export type SystemStatus = "operational" | "degraded" | "down";

export interface SystemHealth {
  system: string;
  status: SystemStatus;
  lastIncident: string | null;
  note: string;
}

// Keyed by a lowercase, space-collapsed alias so a user's natural phrasing
// ("sap ecc", "S/4", "successfactors") still resolves - see
// normalizeSystemName() in tools.ts.
export const SYSTEMS: Record<string, SystemHealth> = {
  "sap ecc": {
    system: "SAP ECC (Production)",
    status: "operational",
    lastIncident: null,
    note: "No open incidents.",
  },
  "sap s/4hana": {
    system: "SAP S/4HANA",
    status: "degraded",
    lastIncident: "INC0048227",
    note: "Workflow approval delays reported since 09:40 CT.",
  },
  "sap concur": {
    system: "SAP Concur",
    status: "operational",
    lastIncident: null,
    note: "No open incidents.",
  },
  "sap successfactors": {
    system: "SAP SuccessFactors",
    status: "operational",
    lastIncident: "INC0048301",
    note: "Prior outage resolved 2026-09-01. Monitoring.",
  },
  "sap ariba": {
    system: "SAP Ariba",
    status: "down",
    lastIncident: null,
    note: "Scheduled maintenance window, expected back 06:00 ET.",
  },
};

export interface KnowledgeArticle {
  articleId: string;
  title: string;
  body: string;
  tags: string[];
}

export const KB_ARTICLES: KnowledgeArticle[] = [
  {
    articleId: "KB0021",
    title: "SAP GUI will not connect over VPN",
    body:
      "If SAP GUI cannot reach the application server while on VPN, confirm the " +
      "Cisco AnyConnect profile is the 'Corp-Split-Tunnel' one, not 'Corp-Full'. " +
      "The split-tunnel profile is required for SAProuter traffic on port 3200.",
    tags: ["sap gui", "vpn", "connection", "saprouter"],
  },
  {
    articleId: "KB0034",
    title: "Requesting a new T-code authorization",
    body:
      "New T-code access (e.g. ME21N, FB50, VA01) requires a role-change request " +
      "submitted through the Access Governance portal, approved by the " +
      "employee's manager and the relevant SAP Basis regional team. Typical " +
      "turnaround is 2 business days.",
    tags: ["authorization", "t-code", "access request", "role"],
  },
  {
    articleId: "KB0047",
    title: "Resetting an SAP password after lockout",
    body:
      "After 3 failed logon attempts, SAP locks the user for 30 minutes " +
      "automatically. For an immediate unlock, IT Basis can reset it manually - " +
      "open a P3 ticket with the employee ID and affected system.",
    tags: ["password", "lockout", "reset", "logon"],
  },
  {
    articleId: "KB0058",
    title: "Concur expense report stuck in approval",
    body:
      "A Concur report stuck at the same approval step for more than 48 hours " +
      "usually means the delegated approver is out of office without a backup " +
      "assigned. Basis West can reassign the workflow step manually on request.",
    tags: ["concur", "expense", "approval", "workflow"],
  },
];
