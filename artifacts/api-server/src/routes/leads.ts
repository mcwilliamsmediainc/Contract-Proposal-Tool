import { Router, type Request, type Response } from "express";
import { eq, or } from "drizzle-orm";
import { db, leadsTable } from "@workspace/db";

const router = Router();

router.get("/admin/leads/lookup", async (req: Request, res: Response) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (!q) {
    res.status(400).json({ error: "Query parameter `q` is required (email or lead UUID)." });
    return;
  }

  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(or(eq(leadsTable.email, q), eq(leadsTable.uuid, q)))
    .limit(1);

  if (!lead) {
    res.status(404).json({ error: "No lead found matching that email or UUID." });
    return;
  }

  // jsonb column comes back parsed. Translate snake_case storage to camelCase wire format.
  const scoresRaw = (lead.auditScore ?? null) as Record<string, unknown> | null;
  const auditScores = scoresRaw
    ? {
        ux: typeof scoresRaw["ux"] === "number" ? scoresRaw["ux"] : null,
        seo: typeof scoresRaw["seo"] === "number" ? scoresRaw["seo"] : null,
        social: typeof scoresRaw["social"] === "number" ? scoresRaw["social"] : null,
        aiVisibility: typeof scoresRaw["ai_visibility"] === "number" ? scoresRaw["ai_visibility"] : null,
      }
    : null;

  res.json({
    id: lead.uuid,
    businessName: lead.businessName,
    contactName: lead.contactName,
    email: lead.email,
    website: lead.website,
    city: lead.city,
    auditScores,
    goal: lead.goal,
    budgetRange: lead.budgetRange,
    status: lead.status,
    source: lead.source,
  });
});

export default router;
