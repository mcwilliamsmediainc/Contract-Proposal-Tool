import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, onboardingClientsTable, onboardingFormResponsesTable } from "@workspace/db";
import { sendOnboardingSubmittedEmail, sendOnboardingSubmittedClientEmail } from "../lib/email";

const router = Router();

function formatFormState(
  client: typeof onboardingClientsTable.$inferSelect,
  form: typeof onboardingFormResponsesTable.$inferSelect | null
) {
  return {
    id: client.uuid,
    clientName: client.clientName,
    businessName: client.businessName,
    clientStrategist: client.clientStrategist ?? null,
    services: (() => {
      try { return JSON.parse(client.services) as string[]; } catch { return []; }
    })(),
    status: (form?.status ?? "pending") as "pending" | "submitted",
    submittedAt: form?.submittedAt?.toISOString() ?? null,
    responses: (() => {
      try { return JSON.parse(form?.responses ?? "{}") as Record<string, unknown>; } catch { return {}; }
    })(),
  };
}

router.get("/onboarding-form/:id", async (req, res) => {
  const { id } = req.params;
  const [client] = await db
    .select()
    .from(onboardingClientsTable)
    .where(eq(onboardingClientsTable.uuid, id))
    .limit(1);

  if (!client) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [form] = await db
    .select()
    .from(onboardingFormResponsesTable)
    .where(eq(onboardingFormResponsesTable.onboardingClientId, id))
    .limit(1);

  res.json(formatFormState(client, form ?? null));
});

router.post("/onboarding-form/:id", async (req, res) => {
  const { id } = req.params;
  const { responses, submitted } = req.body as { responses: Record<string, unknown>; submitted?: boolean };

  const [client] = await db
    .select()
    .from(onboardingClientsTable)
    .where(eq(onboardingClientsTable.uuid, id))
    .limit(1);

  if (!client) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(onboardingFormResponsesTable)
    .where(eq(onboardingFormResponsesTable.onboardingClientId, id))
    .limit(1);

  const now = new Date();
  const responsesJson = JSON.stringify(responses ?? {});
  const status = submitted ? "submitted" : "pending";
  const submittedAt = submitted ? now : (existing?.submittedAt ?? null);

  let form: typeof onboardingFormResponsesTable.$inferSelect;

  if (existing) {
    const [updated] = await db
      .update(onboardingFormResponsesTable)
      .set({ responses: responsesJson, status, submittedAt, updatedAt: now })
      .where(eq(onboardingFormResponsesTable.onboardingClientId, id))
      .returning();
    form = updated;
  } else {
    const [created] = await db
      .insert(onboardingFormResponsesTable)
      .values({
        uuid: randomUUID(),
        onboardingClientId: id,
        responses: responsesJson,
        status,
        submittedAt,
      })
      .returning();
    form = created;
  }

  // Notify strategist and send client confirmation when form is first submitted
  if (submitted && !existing?.submittedAt) {
    sendOnboardingSubmittedEmail({
      clientName: client.clientName,
      businessName: client.businessName,
      onboardingId: id,
      clientStrategist: client.clientStrategist,
      responses: responses as Record<string, unknown>,
    }).catch(() => {});

    if (client.clientEmail) {
      sendOnboardingSubmittedClientEmail({
        clientName: client.clientName,
        businessName: client.businessName,
        clientEmail: client.clientEmail,
      }).catch(() => {});
    }
  }

  res.json(formatFormState(client, form));
});

export default router;
