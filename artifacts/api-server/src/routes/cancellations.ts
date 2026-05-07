import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, cancellationsTable } from "@workspace/db";

const router = Router();

function formatCancellation(c: typeof cancellationsTable.$inferSelect) {
  return {
    id: c.uuid,
    clientName: c.clientName,
    businessName: c.businessName ?? null,
    clientEmail: c.clientEmail ?? null,
    clientStrategist: c.clientStrategist ?? null,
    reason: c.reason ?? null,
    notes: c.notes ?? null,
    cancelledAt: c.cancelledAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/cancellations", async (req, res) => {
  const rows = await db
    .select()
    .from(cancellationsTable)
    .orderBy(desc(cancellationsTable.createdAt));
  res.json(rows.map(formatCancellation));
});

router.post("/cancellations", async (req, res) => {
  const body = req.body as {
    clientName: string;
    businessName?: string | null;
    clientEmail?: string | null;
    clientStrategist?: string | null;
    reason?: string | null;
    notes?: string | null;
    cancelledAt?: string | null;
  };

  if (!body.clientName?.trim()) {
    res.status(400).json({ error: "clientName is required" });
    return;
  }

  const [created] = await db
    .insert(cancellationsTable)
    .values({
      uuid: randomUUID(),
      clientName: body.clientName.trim(),
      businessName: body.businessName ?? null,
      clientEmail: body.clientEmail ?? null,
      clientStrategist: body.clientStrategist ?? null,
      reason: body.reason ?? null,
      notes: body.notes ?? null,
      cancelledAt: body.cancelledAt ? new Date(body.cancelledAt) : null,
    })
    .returning();

  res.status(201).json(formatCancellation(created));
});

router.delete("/cancellations/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const deleted = await db
    .delete(cancellationsTable)
    .where(eq(cancellationsTable.uuid, uuid))
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ error: "Cancellation not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
