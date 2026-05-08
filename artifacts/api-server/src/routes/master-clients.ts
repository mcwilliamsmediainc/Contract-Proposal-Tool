import { Router } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, masterClientsTable } from "@workspace/db";

const router = Router();

function fmt(c: typeof masterClientsTable.$inferSelect) {
  return {
    id: c.uuid,
    flag: c.flag,
    clientName: c.clientName,
    strategist: c.strategist,
    website: c.website,
    hosting: c.hosting,
    seo: c.seo,
    adwords: c.adwords,
    fbads: c.fbads,
    lsa: c.lsa,
    email: c.email,
    social: c.social,
    blog: c.blog,
    mailbox: c.mailbox,
    photo: c.photo,
    tier: c.tier,
    touchpoint: c.touchpoint,
    upsell: c.upsell,
    nextTarget: c.nextTarget,
    other: c.other,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/master-clients", async (req, res) => {
  const rows = await db
    .select()
    .from(masterClientsTable)
    .orderBy(asc(masterClientsTable.sortOrder), asc(masterClientsTable.createdAt));
  res.json(rows.map(fmt));
});

router.post("/master-clients", async (req, res) => {
  const body = req.body as { clientName?: string; strategist?: string };
  if (!body.clientName?.trim()) {
    res.status(400).json({ error: "clientName is required" });
    return;
  }

  const maxOrderRow = await db
    .select()
    .from(masterClientsTable)
    .orderBy(desc(masterClientsTable.sortOrder))
    .limit(1);
  const nextOrder = (maxOrderRow[0]?.sortOrder ?? 0) + 1;

  const [created] = await db
    .insert(masterClientsTable)
    .values({
      uuid: randomUUID(),
      clientName: body.clientName.trim(),
      strategist: body.strategist ?? "",
      sortOrder: nextOrder,
    })
    .returning();

  res.status(201).json(fmt(created));
});

router.patch("/master-clients/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const body = req.body as Partial<{
    flag: string;
    clientName: string;
    strategist: string;
    website: boolean;
    hosting: boolean;
    seo: boolean;
    adwords: boolean;
    fbads: boolean;
    lsa: boolean;
    email: boolean;
    social: boolean;
    blog: boolean;
    mailbox: boolean;
    photo: boolean;
    tier: string;
    touchpoint: string;
    upsell: string;
    nextTarget: string;
    other: string;
    sortOrder: number;
  }>;

  const [updated] = await db
    .update(masterClientsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(masterClientsTable.uuid, uuid))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(fmt(updated));
});

router.delete("/master-clients/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const deleted = await db
    .delete(masterClientsTable)
    .where(eq(masterClientsTable.uuid, uuid))
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
