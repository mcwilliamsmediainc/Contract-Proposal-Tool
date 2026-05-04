import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
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
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
