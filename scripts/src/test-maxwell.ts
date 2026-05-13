import { db, clientsTable, leadsTable, monthlyTasksTable } from "@workspace/db";
import { gte, lt, eq, and, sql } from "drizzle-orm";
import {
  formatMorningBriefing,
  isSlackConfigured,
  postMorningBriefing,
  type MorningBriefing,
} from "@workspace/integrations-slack";

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

  // TODO: reports table doesn't exist yet. Placeholder until reporting schema lands.
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

async function main() {
  console.log("→ Gathering Maxwell briefing from PostgreSQL...");
  const briefing = await gatherBriefing();

  console.log("\n=== Maxwell briefing ===");
  console.log(formatMorningBriefing(briefing));
  console.log("========================\n");

  if (isSlackConfigured()) {
    console.log("→ SLACK_BOT_TOKEN is set — posting to #ops-daily");
    await postMorningBriefing("#ops-daily", briefing);
    console.log("✓ Posted.");
  } else {
    console.log("ℹ SLACK_BOT_TOKEN not set — skipping Slack post (console output above is the only signal).");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Maxwell test failed:", err);
    process.exit(1);
  });
