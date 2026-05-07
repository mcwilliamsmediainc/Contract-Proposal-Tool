import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  clientName: text("client_name").notNull(),
  businessName: text("business_name").notNull(),
  clientEmail: text("client_email").notNull(),
  projectType: text("project_type").notNull(),
  status: text("status").notNull().default("draft"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  content: text("content"),
  specialContext: text("special_context"),
  loomVideoUrl: text("loom_video_url"),
  calendlyUrl: text("calendly_url"),
  signatureData: text("signature_data"),
  signedAt: timestamp("signed_at"),
  numberOfPages: integer("number_of_pages"),
  pageNames: text("page_names"),
  clientStrategist: text("client_strategist"),
  selectedTier: text("selected_tier"),
  pricingItems: text("pricing_items"),
  notes: text("notes"),
  brandShootEnabled: boolean("brand_shoot_enabled").notNull().default(true),
  brandShootText: text("brand_shoot_text"),
  discountType: text("discount_type"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }),
  discountLabel: text("discount_label"),
  viewCount: integer("view_count").notNull().default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cancellationsTable = pgTable("cancellations", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  clientName: text("client_name").notNull(),
  businessName: text("business_name"),
  clientEmail: text("client_email"),
  clientStrategist: text("client_strategist"),
  reason: text("reason"),
  notes: text("notes"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Cancellation = typeof cancellationsTable.$inferSelect;

export const onboardingClientsTable = pgTable("onboarding_clients", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  clientName: text("client_name").notNull(),
  businessName: text("business_name").notNull(),
  clientEmail: text("client_email"),
  clientStrategist: text("client_strategist"),
  services: text("services").notNull().default("[]"),
  proposalId: text("proposal_id"),
  contractId: text("contract_id"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const onboardingFormResponsesTable = pgTable("onboarding_form_responses", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  onboardingClientId: text("onboarding_client_id").notNull(),
  responses: text("responses").notNull().default("{}"),
  status: text("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const onboardingTasksTable = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  proposalUuid: text("proposal_uuid").notNull(),
  label: text("label").notNull(),
  completed: boolean("completed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOnboardingClientSchema = createInsertSchema(onboardingClientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
export type OnboardingTask = typeof onboardingTasksTable.$inferSelect;

export const auditLeadsTable = pgTable("audit_leads", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  url: text("url").notNull(),
  city: text("city").notNull(),
  challenge: text("challenge"),
  email: text("email"),
  status: text("status").notNull().default("new"),
  scores: jsonb("scores"),
  scanData: jsonb("scan_data"),
  businessType: text("business_type"),
  budget: text("budget"),
  goal: text("goal"),
  proposalRequested: boolean("proposal_requested").notNull().default(false),
  proposalRequestedAt: timestamp("proposal_requested_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AuditLead = typeof auditLeadsTable.$inferSelect;
