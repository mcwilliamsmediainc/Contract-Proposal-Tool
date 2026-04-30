import { Router } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db, proposalsTable } from "@workspace/db";

const router = Router();

router.get("/admin/stats", async (req, res) => {
  const proposals = await db.select().from(proposalsTable);

  const totalProposals = proposals.length;
  const draftCount = proposals.filter((p) => p.status === "draft").length;
  const sentCount = proposals.filter((p) => p.status === "sent").length;
  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;
  const activePipeline = sentCount + draftCount;
  const totalEngagement = proposals.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);
  const conversionRate =
    totalProposals > 0 ? (acceptedCount / totalProposals) * 100 : 0;

  res.json({
    totalEngagement,
    activePipeline,
    conversionRate: Math.round(conversionRate * 10) / 10,
    totalProposals,
    draftCount,
    sentCount,
    acceptedCount,
  });
});

export default router;
