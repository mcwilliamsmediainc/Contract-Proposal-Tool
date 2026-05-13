import { Router, type Request, type Response } from "express";
import { desc, eq, and, isNull, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, auditLeadsTable, leadsTable } from "@workspace/db";
import { scanWebsite } from "../lib/audit-scanner.js";
import { sendReportEmail, notifyTeamNewLead, notifyTeamProposalRequest } from "../lib/audit-email.js";

const router = Router();

const scanCounts: Record<string, { count: number; windowStart: number }> = {};
const SCAN_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function rateLimit(req: Request, res: Response, next: () => void): void {
  const ip = req.ip ?? "unknown";
  const now = Date.now();

  if (!scanCounts[ip]) scanCounts[ip] = { count: 0, windowStart: now };
  const record = scanCounts[ip];

  if (now - record.windowStart > WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= SCAN_LIMIT) {
    res.status(429).json({ error: "Too many scans. Please try again in an hour." });
    return;
  }

  record.count++;
  next();
}

type DbLead = typeof auditLeadsTable.$inferSelect;
type ScoresObj = Record<string, number> | null;

function getScores(lead: DbLead): ScoresObj {
  if (!lead.scores) return null;
  if (typeof lead.scores === "object") return lead.scores as ScoresObj;
  try { return JSON.parse(lead.scores as string) as ScoresObj; } catch { return null; }
}

function getScanData(lead: DbLead): Record<string, unknown> | null {
  if (!lead.scanData) return null;
  if (typeof lead.scanData === "object") return lead.scanData as Record<string, unknown>;
  try { return JSON.parse(lead.scanData as string) as Record<string, unknown>; } catch { return null; }
}

function formatLead(l: DbLead) {
  return {
    id: l.uuid,
    url: l.url,
    city: l.city,
    challenge: l.challenge ?? null,
    email: l.email ?? null,
    status: l.status,
    scores: getScores(l),
    businessType: l.businessType ?? null,
    budget: l.budget ?? null,
    goal: l.goal ?? null,
    proposalRequested: l.proposalRequested,
    proposalRequestedAt: l.proposalRequestedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

router.post("/audit/create", async (req: Request, res: Response) => {
  const { url, city, challenge } = req.body as {
    url?: string;
    city?: string;
    challenge?: string;
  };

  if (!url?.trim() || !city?.trim()) {
    res.status(400).json({ error: "URL and city are required." });
    return;
  }

  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  const [lead] = await db
    .insert(auditLeadsTable)
    .values({
      uuid: randomUUID(),
      url: normalizedUrl,
      city: city.trim(),
      challenge: challenge?.trim() ?? null,
      status: "new",
    })
    .returning();

  res.json({ leadId: lead.uuid });
});

router.post("/audit/scan", rateLimit, async (req: Request, res: Response) => {
  const { leadId } = req.body as { leadId?: string };
  if (!leadId) {
    res.status(400).json({ error: "leadId is required." });
    return;
  }

  const [lead] = await db
    .select()
    .from(auditLeadsTable)
    .where(eq(auditLeadsTable.uuid, leadId))
    .limit(1);

  if (!lead) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  try {
    const scanResult = await scanWebsite(lead.url, lead.city);

    await db
      .update(auditLeadsTable)
      .set({
        scores: scanResult.scores as unknown as typeof auditLeadsTable.$inferInsert["scores"],
        scanData: {
          observations: scanResult.observations,
          rawData: scanResult.rawData,
        } as unknown as typeof auditLeadsTable.$inferInsert["scanData"],
        businessType: scanResult.businessType,
        status: "scanned",
        updatedAt: new Date(),
      })
      .where(eq(auditLeadsTable.uuid, leadId));

    res.json({
      leadId,
      scores: {
        ux:          scanResult.scores.ux,
        seo:         scanResult.scores.seo,
        gbp:         scanResult.scores.gbp,
        reviews:     scanResult.scores.reviews,
        trust:       scanResult.scores.trust,
        content:     scanResult.scores.content,
        leadCapture: scanResult.scores.leadCapture,
        social:      null,
        aiVisibility: null,
      },
      observations: {
        ux:          scanResult.observations.ux,
        seo:         scanResult.observations.seo,
        gbp:         scanResult.observations.gbp,
        reviews:     scanResult.observations.reviews,
        trust:       scanResult.observations.trust,
        content:     scanResult.observations.content,
        leadCapture: scanResult.observations.leadCapture,
      },
      businessType: scanResult.businessType,
    });
  } catch (err) {
    req.log.error({ err }, "Audit scan failed");
    res.status(500).json({ error: "Scan failed. Please check the URL and try again." });
  }
});

router.post("/audit/capture", async (req: Request, res: Response) => {
  const { leadId, email } = req.body as { leadId?: string; email?: string };

  if (!leadId || !email) {
    res.status(400).json({ error: "leadId and email are required." });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const [updated] = await db
    .update(auditLeadsTable)
    .set({ email, status: "email_captured", updatedAt: new Date() })
    .where(eq(auditLeadsTable.uuid, leadId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  sendReportEmail(updated).catch((err: unknown) => req.log.error({ err }, "Audit report email failed"));
  notifyTeamNewLead(updated).catch((err: unknown) => req.log.error({ err }, "Team notify email failed"));

  const scanData = getScanData(updated);

  res.json({
    success: true,
    scores: getScores(updated),
    observations: scanData?.["observations"] ?? null,
    businessType: updated.businessType,
  });
});

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Promote a qualified audit_leads row into the agency `leads` table so Finn
 * (and the rest of the agent system) can read from a single source of truth.
 * The audit_leads row stays as the raw funnel record.
 *
 * Idempotent on (email, source='audit_tool') — safe to call twice.
 */
async function promoteAuditLeadToLeads(audit: DbLead, req: Request): Promise<void> {
  if (!audit.email) {
    req.log.warn({ auditUuid: audit.uuid }, "Skipping lead promotion — no email captured");
    return;
  }

  const existing = await db
    .select({ uuid: leadsTable.uuid })
    .from(leadsTable)
    .where(and(eq(leadsTable.email, audit.email), eq(leadsTable.source, "audit_tool")))
    .limit(1);

  if (existing[0]) {
    req.log.info({ auditUuid: audit.uuid, leadUuid: existing[0].uuid }, "Lead already promoted — skipping");
    return;
  }

  const scores = getScores(audit);
  const businessName = audit.businessType?.trim() || extractHostname(audit.url) || audit.url;

  await db.insert(leadsTable).values({
    uuid: randomUUID(),
    businessName,
    email: audit.email,
    website: audit.url,
    city: audit.city,
    auditScore: scores,
    goal: audit.goal,
    budgetRange: audit.budget,
    status: "new",
    source: "audit_tool",
  });

  // Console-log a Slack-style notification. Maxwell will post the real
  // message once SLACK_BOT_TOKEN is configured.
  const s = scores ?? {};
  const fmt = (v: unknown) => (typeof v === "number" ? String(v) : "—");
  console.log(
    `New lead: ${businessName} — Audit score: UX ${fmt(s["ux"])} / SEO ${fmt(s["seo"])} / Social ${fmt(s["social"])} / AI ${fmt(s["ai_visibility"])} — Goal: ${audit.goal ?? "—"} — Budget: ${audit.budget ?? "—"}`,
  );
}

router.post("/audit/qualify", async (req: Request, res: Response) => {
  const { leadId, budget, goal } = req.body as {
    leadId?: string;
    budget?: string;
    goal?: string;
  };

  if (!leadId) {
    res.status(400).json({ error: "leadId is required." });
    return;
  }

  const [updated] = await db
    .update(auditLeadsTable)
    .set({
      budget: budget ?? null,
      goal: goal ?? null,
      status: "qualified",
      updatedAt: new Date(),
    })
    .where(eq(auditLeadsTable.uuid, leadId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  await promoteAuditLeadToLeads(updated, req);

  res.json({ success: true });
});

router.post("/audit/request-proposal", async (req: Request, res: Response) => {
  const { leadId } = req.body as { leadId?: string };
  if (!leadId) {
    res.status(400).json({ error: "leadId is required." });
    return;
  }

  const [updated] = await db
    .update(auditLeadsTable)
    .set({
      proposalRequested: true,
      proposalRequestedAt: new Date(),
      status: "proposal_requested",
      updatedAt: new Date(),
    })
    .where(eq(auditLeadsTable.uuid, leadId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  notifyTeamProposalRequest(updated).catch((err: unknown) =>
    req.log.error({ err }, "Proposal request email failed")
  );

  res.json({ success: true });
});

router.get("/audit/request-proposal", async (req: Request, res: Response) => {
  const leadId = req.query["leadId"] as string | undefined;
  if (!leadId) {
    res.status(400).json({ error: "leadId is required." });
    return;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "";
  const basePath = domain ? `https://${domain}` : "";

  const [updated] = await db
    .update(auditLeadsTable)
    .set({
      proposalRequested: true,
      proposalRequestedAt: new Date(),
      status: "proposal_requested",
      updatedAt: new Date(),
    })
    .where(eq(auditLeadsTable.uuid, leadId))
    .returning();

  if (!updated) {
    res.redirect(`${basePath}/audit?status=not_found`);
    return;
  }

  notifyTeamProposalRequest(updated).catch((err: unknown) =>
    req.log.error({ err }, "Proposal request email failed")
  );

  res.redirect(`${basePath}/audit?status=proposal_requested`);
});

router.get("/admin/audit-leads", async (req: Request, res: Response) => {
  const showArchived = req.query["archived"] === "true";
  const rows = await db
    .select()
    .from(auditLeadsTable)
    .where(showArchived ? isNotNull(auditLeadsTable.archivedAt) : isNull(auditLeadsTable.archivedAt))
    .orderBy(desc(auditLeadsTable.createdAt));
  res.json(rows.map(formatLead));
});

router.get("/admin/audit-leads/:uuid", async (req: Request, res: Response) => {
  const [lead] = await db
    .select()
    .from(auditLeadsTable)
    .where(eq(auditLeadsTable.uuid, req.params["uuid"] ?? ""))
    .limit(1);

  if (!lead) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }

  res.json(formatLead(lead));
});

router.post("/admin/audit-leads/:uuid/archive", async (req: Request, res: Response) => {
  const [updated] = await db
    .update(auditLeadsTable)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(auditLeadsTable.uuid, req.params["uuid"] ?? ""))
    .returning();
  if (!updated) { res.status(404).json({ error: "Lead not found." }); return; }
  res.json({ success: true });
});

router.post("/admin/audit-leads/:uuid/unarchive", async (req: Request, res: Response) => {
  const [updated] = await db
    .update(auditLeadsTable)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(eq(auditLeadsTable.uuid, req.params["uuid"] ?? ""))
    .returning();
  if (!updated) { res.status(404).json({ error: "Lead not found." }); return; }
  res.json({ success: true });
});

router.delete("/admin/audit-leads/:uuid", async (req: Request, res: Response) => {
  const [deleted] = await db
    .delete(auditLeadsTable)
    .where(eq(auditLeadsTable.uuid, req.params["uuid"] ?? ""))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Lead not found." }); return; }
  res.json({ success: true });
});

export default router;
