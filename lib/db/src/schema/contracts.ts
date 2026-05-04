import {
  pgTable,
  text,
  serial,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  proposalId: text("proposal_id"),
  clientName: text("client_name").notNull(),
  businessName: text("business_name").notNull(),
  clientEmail: text("client_email").notNull(),
  contractType: text("contract_type").notNull().default("website"),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  remainingBalance: numeric("remaining_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  hostingOption: text("hosting_option").notNull().default("none"),
  status: text("status").notNull().default("draft"),
  signatureData: text("signature_data"),
  signedAt: timestamp("signed_at"),
  referralSource: text("referral_source"),
  teamMember: text("team_member"),
  companyAddress: text("company_address"),
  companyAddressLine2: text("company_address_line2"),
  companyCity: text("company_city"),
  companyState: text("company_state"),
  companyZip: text("company_zip"),
  scheduleA: text("schedule_a"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contractsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contractsTable.$inferSelect;
