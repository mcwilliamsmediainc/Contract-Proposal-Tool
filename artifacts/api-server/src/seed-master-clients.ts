import { randomUUID } from "crypto";
import { db, masterClientsTable } from "@workspace/db";
import { ne, sql } from "drizzle-orm";
import { MASTER_CLIENT_SEED } from "./seed-master-clients-data";
import { logger } from "./lib/logger";

export async function seedMasterClientsIfEmpty() {
  // Count real clients (ignore "New client" placeholder rows from testing)
  const [{ realCount }] = await db
    .select({ realCount: sql<number>`count(*)::int` })
    .from(masterClientsTable)
    .where(ne(masterClientsTable.clientName, "New client"));

  if (realCount >= 10) {
    logger.info({ realCount }, "master_clients already seeded, skipping");
    return;
  }

  // Remove any leftover placeholder rows before seeding
  await db.delete(masterClientsTable);

  logger.info("Seeding master_clients with initial data…");

  const values = MASTER_CLIENT_SEED.map((r) => ({
    uuid: randomUUID(),
    flag: r[0] as string,
    clientName: r[1] as string,
    strategist: r[2] as string,
    website: r[3] as boolean,
    hosting: r[4] as boolean,
    seo: r[5] as boolean,
    adwords: r[6] as boolean,
    fbads: r[7] as boolean,
    lsa: r[8] as boolean,
    email: r[9] as boolean,
    social: r[10] as boolean,
    blog: r[11] as boolean,
    mailbox: r[12] as boolean,
    photo: r[13] as boolean,
    tier: r[14] as string,
    touchpoint: r[15] as string,
    upsell: r[16] as string,
    nextTarget: r[17] as string,
    other: r[18] as string,
    sortOrder: r[19] as number,
  }));

  await db.insert(masterClientsTable).values(values);
  logger.info({ inserted: values.length }, "master_clients seeded successfully");
}
