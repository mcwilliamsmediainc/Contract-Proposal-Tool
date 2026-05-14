// POST /api/agents/maxwell/briefing
//
// Triggered daily at 7am Central from Make.com (or any cron-style scheduler).
// Queries the agency database, formats Maxwell's morning briefing, and posts
// it to #ops-daily via the Slack bot token.
//
// ── Make.com scenario setup ────────────────────────────────────────────────
//  1. Create a new scenario in Make.com
//  2. Add a "Schedule" trigger → "Every Day" at 7:00 AM
//  3. Time zone: America/Chicago (Central — handles CST/CDT automatically)
//  4. Add an "HTTP → Make a request" module
//     • URL:     https://<your-replit-app-url>/api/agents/maxwell/briefing
//     • Method:  POST
//     • Headers: x-api-key: <MAXWELL_API_KEY value from Replit Secrets>
//     • Body:    (none — endpoint takes no payload)
//  5. Save and activate the scenario
// ───────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from "express";
import { gte, lt, eq, and, sql } from "drizzle-orm";
import { db, clientsTable, leadsTable, monthlyTasksTable } from "@workspace/db";
import {
  formatMorningBriefing,
  postMorningBriefing,
  isSlackConfigured,
  type MorningBriefing,
} from "@workspace/integrations-slack";

const router = Router();

async function gatherBriefing(): Promise<MorningBriefing> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();

  const [{ count: activeClientCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clientsTable);

  const [{ count: newLeadsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leadsTable)
    .where(gte(leadsTable.createdAt, dayAgo));

  const [{ count: pendingTasksCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(monthlyTasksTable)
    .where(eq(monthlyTasksTable.status, "pending"));

  const [{ count: overdueTasksCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(monthlyTasksTable)
    .where(
      and(
        lt(monthlyTasksTable.dueDate, now),
        sql`${monthlyTasksTable.status} <> 'complete'`,
      ),
    );

  // TODO: reports table doesn't exist yet — placeholder until reporting schema lands.
  const reportsDueCount = 0;

  return {
    activeClientCount,
    newLeadsCount,
    pendingTasksCount,
    overdueTasksCount,
    reportsDueCount,
    flags: [],
  };
}

router.post("/agents/maxwell/briefing", async (req: Request, res: Response) => {
  // API key gate. The route is in the public-path allowlist (so Clerk middleware
  // doesn't try to auth it as an admin call); this header check is the actual gate.
  const presentedKey = req.header("x-api-key");
  const expectedKey = process.env.MAXWELL_API_KEY;

  if (!expectedKey) {
    req.log.error("MAXWELL_API_KEY not configured on the server — refusing to expose the endpoint");
    res.status(500).json({ error: "Maxwell endpoint not configured." });
    return;
  }

  if (!presentedKey || presentedKey !== expectedKey) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const briefing = await gatherBriefing();
    const text = formatMorningBriefing(briefing);

    if (!isSlackConfigured()) {
      req.log.warn("SLACK_BOT_TOKEN not set — briefing computed but not posted");
      res.status(500).json({
        error: "Slack not configured — set SLACK_BOT_TOKEN in Replit Secrets.",
        briefing: text,
      });
      return;
    }

    await postMorningBriefing("#ops-daily", briefing);
    res.json({
      success: true,
      briefing: text,
      postedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Maxwell briefing failed");
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Briefing failed.", detail });
  }
});

export default router;
