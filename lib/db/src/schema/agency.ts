import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// leads
// Qualified inbound prospects, promoted into this table by Finn after he
// processes audit_leads. Manually-entered leads (referrals, etc.) also land
// here. Soft-linked to audit_leads via business email / domain at the app
// layer — no DB-level FK back to audit_leads, per repo convention.
// ---------------------------------------------------------------------------
export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  city: text("city"),
  // { ux: number, seo: number, social: number, ai_visibility: number }
  auditScore: jsonb("audit_score"),
  goal: text("goal"),
  budgetRange: text("budget_range"),
  // new | qualified | proposal_sent | signed | active | churned
  status: text("status").notNull().default("new"),
  source: text("source"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Lead = typeof leadsTable.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// ---------------------------------------------------------------------------
// clients
// Post-signing master record. The agent system reads from this table.
// Soft-linked to onboarding_clients and contracts via their uuids — repo
// convention is text uuid soft-links across business entities.
// ---------------------------------------------------------------------------
export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  onboardingClientUuid: text("onboarding_client_uuid"),
  contractUuid: text("contract_uuid"),
  businessName: text("business_name").notNull(),
  // pro | plus | platinum | custom
  planTier: text("plan_tier").notNull(),
  // JSON-encoded string array, matching onboarding_clients.services
  services: text("services").notNull().default("[]"),
  monthlyValue: numeric("monthly_value", { precision: 10, scale: 2 }),
  // Per-service monthly breakdown. monthly_value is the rollup; these are
  // line items. All optional — only populate the services this client has.
  seoAmount: numeric("seo_amount", { precision: 10, scale: 2 }),
  googleAdsAmount: numeric("google_ads_amount", { precision: 10, scale: 2 }),
  metaAdsAmount: numeric("meta_ads_amount", { precision: 10, scale: 2 }),
  socialMediaAmount: numeric("social_media_amount", { precision: 10, scale: 2 }),
  emailAmount: numeric("email_amount", { precision: 10, scale: 2 }),
  blogAmount: numeric("blog_amount", { precision: 10, scale: 2 }),
  hostingAmount: numeric("hosting_amount", { precision: 10, scale: 2 }),
  lsaAmount: numeric("lsa_amount", { precision: 10, scale: 2 }),
  hostingPackage: text("hosting_package"),
  startDate: timestamp("start_date"),
  renewalDate: timestamp("renewal_date"),
  healthScore: integer("health_score"),
  clientStrategist: text("client_strategist"),
  assignedTeamMember: text("assigned_team_member"),
  brandVoiceProfile: jsonb("brand_voice_profile"),
  knowledgeBaseNotes: text("knowledge_base_notes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Client = typeof clientsTable.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------
export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  // website | seo | ads | social | content | design
  type: text("type").notNull(),
  phase: text("phase"),
  status: text("status").notNull().default("planning"),
  deadline: timestamp("deadline"),
  // [{ name, status, url? }, ...]
  deliverables: jsonb("deliverables"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Project = typeof projectsTable.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// ---------------------------------------------------------------------------
// monthly_tasks
// ---------------------------------------------------------------------------
export const monthlyTasksTable = pgTable("monthly_tasks", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projectsTable.id, {
    onDelete: "set null",
  }),
  taskType: text("task_type").notNull(),
  // free text: agent name (e.g. "finn", "sage") or team-member identifier
  assignedTo: text("assigned_to"),
  dueDate: timestamp("due_date"),
  // pending | in_progress | review | complete
  status: text("status").notNull().default("pending"),
  outputUrl: text("output_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMonthlyTaskSchema = createInsertSchema(monthlyTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MonthlyTask = typeof monthlyTasksTable.$inferSelect;
export type InsertMonthlyTask = z.infer<typeof insertMonthlyTaskSchema>;

// ---------------------------------------------------------------------------
// agent_logs — append-only audit trail of agent runs
// client_id is nullable so cross-client / system runs can be logged too.
// On client delete the log row survives with client_id set to null.
// ---------------------------------------------------------------------------
export const agentLogsTable = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  agentName: text("agent_name").notNull(),
  clientId: integer("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  taskType: text("task_type"),
  inputSummary: text("input_summary"),
  outputSummary: text("output_summary"),
  status: text("status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentLogSchema = createInsertSchema(agentLogsTable).omit({
  id: true,
  createdAt: true,
});

export type AgentLog = typeof agentLogsTable.$inferSelect;
export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;

// ---------------------------------------------------------------------------
// knowledge_base — append-only per-client memory
// created_by holds either a Clerk userId or an agent name.
// ---------------------------------------------------------------------------
export const knowledgeBaseTable = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  // email_summary | call_note | decision | preference | brand_voice
  entryType: text("entry_type").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBaseTable).omit({
  id: true,
  createdAt: true,
});

export type KnowledgeBase = typeof knowledgeBaseTable.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
