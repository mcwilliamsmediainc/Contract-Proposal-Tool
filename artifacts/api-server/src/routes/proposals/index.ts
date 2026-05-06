import { Router } from "express";
import { eq, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, proposalsTable, onboardingTasksTable, onboardingClientsTable } from "@workspace/db";
import {
  CreateProposalBody,
  UpdateProposalBody,
  AcceptProposalBody,
  GetProposalParams,
  UpdateProposalParams,
  DeleteProposalParams,
  AcceptProposalParams,
  RecordProposalViewParams,
  ListProposalsQueryParams,
  GenerateProposalContentBody,
  ListOnboardingTasksParams,
  ToggleOnboardingTaskParams,
  ToggleOnboardingTaskBody,
  DeleteOnboardingTaskParams,
  AddOnboardingTaskParams,
  AddOnboardingTaskBody,
  CreateOnboardingClientBody,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  sendProposalViewedEmail,
  sendProposalAcceptedEmail,
  sendProposalAcceptedClientEmail,
} from "../../lib/email";

const router = Router();

const DEFAULT_ONBOARDING_TASKS = [
  "Send welcome email",
  "Schedule kickoff call",
  "Collect brand assets",
  "Set up client portal access",
  "Deliver first milestone",
];

// Public formatter — safe for client portal routes; never includes internal notes.
// Matches the PublicProposal schema in openapi.yaml.
function formatProposalPublic(p: typeof proposalsTable.$inferSelect) {
  return {
    id: String(p.uuid ?? p.id),
    clientName: p.clientName,
    businessName: p.businessName,
    clientEmail: p.clientEmail,
    projectType: p.projectType,
    status: p.status,
    totalAmount: Number(p.totalAmount),
    content: p.content ?? null,
    specialContext: p.specialContext ?? null,
    loomVideoUrl: p.loomVideoUrl ?? null,
    calendlyUrl: p.calendlyUrl ?? null,
    signatureData: p.signatureData ?? null,
    signedAt: p.signedAt?.toISOString() ?? null,
    numberOfPages: p.numberOfPages ?? null,
    pageNames: p.pageNames ?? null,
    selectedTier: p.selectedTier ?? null,
    pricingItems: p.pricingItems ?? null,
    clientStrategist: p.clientStrategist ?? null,
    viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// Admin formatter — adds internal notes on top of the public shape.
// Matches the Proposal schema (extends PublicProposal) in openapi.yaml.
function formatProposal(p: typeof proposalsTable.$inferSelect) {
  return {
    ...formatProposalPublic(p),
    notes: p.notes ?? null,
  };
}

function formatOnboardingClient(c: typeof onboardingClientsTable.$inferSelect) {
  let services: string[] = [];
  try { services = JSON.parse(c.services) as string[]; } catch { services = []; }
  return {
    id: c.uuid,
    clientName: c.clientName,
    businessName: c.businessName,
    clientEmail: c.clientEmail ?? null,
    clientStrategist: c.clientStrategist ?? null,
    services,
    proposalId: c.proposalId ?? null,
    contractId: c.contractId ?? null,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function formatTask(t: typeof onboardingTasksTable.$inferSelect) {
  return {
    id: t.id,
    proposalUuid: t.proposalUuid,
    label: t.label,
    completed: t.completed,
    sortOrder: t.sortOrder,
    createdAt: t.createdAt.toISOString(),
  };
}

async function seedDefaultTasks(proposalUuid: string) {
  const tasks = DEFAULT_ONBOARDING_TASKS.map((label, idx) => ({
    proposalUuid,
    label,
    sortOrder: idx,
    completed: false,
  }));
  await db.insert(onboardingTasksTable).values(tasks);
}

router.get("/proposals/generate", (req, res) => {
  res.status(405).json({ error: "Method not allowed. Use POST." });
});

router.post("/proposals/generate", async (req, res) => {
  const parsed = GenerateProposalContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { clientName, businessName, projectType, specialContext } = parsed.data;

  const projectLabel = projectType === "web" ? "website" : projectType === "marketing" ? "marketing strategy" : projectType === "print" ? "print & brand" : "project";

  const userPrompt = `Write a short, warm, personalized opening for ${clientName} at ${businessName}'s ${projectLabel} proposal.
${specialContext ? `\nNotes from our team: ${specialContext}` : ""}

Requirements:
- 2 short paragraphs, 80–100 words total
- Paragraph 1: Personal welcome that mentions their business name and something specific about why we're excited for this project
- Paragraph 2: One sentence that bridges naturally to the proposal content ahead
- Warm, confident, professional tone — never generic
- NO headers, NO bullet points, NO section titles, NO markdown
- Return ONLY the two paragraphs, nothing else`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      config: { maxOutputTokens: 512 },
    });

    const content = response.text ?? "";
    res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Gemini generation failed");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.get("/proposals", async (req, res) => {
  const parsed = ListProposalsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  const proposals = await db
    .select()
    .from(proposalsTable)
    .where(status ? eq(proposalsTable.status, status) : undefined)
    .orderBy(desc(proposalsTable.createdAt));

  res.json(proposals.map(formatProposal));
});

router.post("/proposals", async (req, res) => {
  const parsed = CreateProposalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const [proposal] = await db
    .insert(proposalsTable)
    .values({
      uuid: randomUUID(),
      clientName: data.clientName,
      businessName: data.businessName,
      clientEmail: data.clientEmail,
      projectType: data.projectType,
      totalAmount: String(data.totalAmount ?? 0),
      content: data.content ?? null,
      specialContext: data.specialContext ?? null,
      loomVideoUrl: data.loomVideoUrl ?? null,
      calendlyUrl: data.calendlyUrl ?? null,
      numberOfPages: data.numberOfPages ?? null,
      pageNames: data.pageNames ?? null,
      clientStrategist: data.clientStrategist ?? null,
      status: "draft",
    })
    .returning();

  res.status(201).json(formatProposal(proposal));
});

router.get("/proposals/:id/onboarding-tasks", async (req, res) => {
  const parsed = ListOnboardingTasksParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parsed.data;
  // Check onboarding_clients (covers both proposal-backed and standalone clients)
  const client = await db
    .select({ uuid: onboardingClientsTable.uuid })
    .from(onboardingClientsTable)
    .where(eq(onboardingClientsTable.uuid, id))
    .limit(1);
  if (!client[0]) {
    res.status(404).json({ error: "Onboarding client not found" });
    return;
  }

  const tasks = await db
    .select()
    .from(onboardingTasksTable)
    .where(eq(onboardingTasksTable.proposalUuid, id))
    .orderBy(asc(onboardingTasksTable.sortOrder), asc(onboardingTasksTable.createdAt));

  res.json(tasks.map(formatTask));
});

router.post("/proposals/:id/onboarding-tasks/add", async (req, res) => {
  const paramsParsed = AddOnboardingTaskParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = AddOnboardingTaskBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "label is required" });
    return;
  }

  const { id } = paramsParsed.data;
  const { label } = bodyParsed.data;

  // Check onboarding_clients (covers both proposal-backed and standalone clients)
  const clientRow = await db
    .select({ uuid: onboardingClientsTable.uuid })
    .from(onboardingClientsTable)
    .where(eq(onboardingClientsTable.uuid, id))
    .limit(1);
  if (!clientRow[0]) {
    res.status(404).json({ error: "Onboarding client not found" });
    return;
  }

  const existing = await db.select().from(onboardingTasksTable).where(eq(onboardingTasksTable.proposalUuid, id));
  const sortOrder = existing.length;

  const [task] = await db
    .insert(onboardingTasksTable)
    .values({ proposalUuid: id, label, sortOrder, completed: false })
    .returning();

  res.status(201).json(formatTask(task));
});

router.get("/proposals/:id", async (req, res) => {
  const parsed = GetProposalParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parsed.data;
  const proposal = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.uuid, id))
    .limit(1);

  if (!proposal[0]) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  // Public route — portal consumes this, never include notes
  res.json(formatProposalPublic(proposal[0]));
});

// Admin-only endpoint — returns internal notes; not included in the public portal response.
// Documented in openapi.yaml as GET /proposals/{id}/notes.
router.get("/proposals/:id/notes", async (req, res) => {
  const id = req.params.id;
  const proposal = await db
    .select({ notes: proposalsTable.notes })
    .from(proposalsTable)
    .where(eq(proposalsTable.uuid, id))
    .limit(1);

  if (!proposal[0]) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  res.json({ notes: proposal[0].notes ?? null });
});

router.patch("/proposals/:id", async (req, res) => {
  const paramsParsed = UpdateProposalParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateProposalBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { id } = paramsParsed.data;
  const data = bodyParsed.data;

  const updateData: Partial<typeof proposalsTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.clientName !== undefined) updateData.clientName = data.clientName;
  if (data.businessName !== undefined) updateData.businessName = data.businessName;
  if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
  if (data.projectType !== undefined) updateData.projectType = data.projectType;
  if (data.totalAmount !== undefined) updateData.totalAmount = String(data.totalAmount);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.specialContext !== undefined) updateData.specialContext = data.specialContext;
  if (data.loomVideoUrl !== undefined) updateData.loomVideoUrl = data.loomVideoUrl;
  if (data.calendlyUrl !== undefined) updateData.calendlyUrl = data.calendlyUrl;
  if (data.numberOfPages !== undefined) updateData.numberOfPages = data.numberOfPages;
  if (data.pageNames !== undefined) updateData.pageNames = data.pageNames;
  if (data.clientStrategist !== undefined) updateData.clientStrategist = data.clientStrategist;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.selectedTier !== undefined) updateData.selectedTier = data.selectedTier ?? null;
  if (data.pricingItems !== undefined) updateData.pricingItems = data.pricingItems ?? null;

  const [updated] = await db
    .update(proposalsTable)
    .set(updateData)
    .where(eq(proposalsTable.uuid, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  // When transitioning to accepted via PATCH, ensure onboarding_client exists
  if (data.status === "accepted") {
    const services = updated.projectType === "web"
      ? ["website"]
      : updated.projectType === "marketing" || updated.projectType === "tiered"
        ? ["marketing"]
        : updated.projectType === "print"
          ? ["print"]
          : [];

    const existingClient = await db
      .select()
      .from(onboardingClientsTable)
      .where(eq(onboardingClientsTable.proposalId, id))
      .limit(1);

    if (existingClient.length === 0) {
      await db.insert(onboardingClientsTable).values({
        uuid: id,
        clientName: updated.clientName,
        businessName: updated.businessName,
        clientEmail: updated.clientEmail,
        clientStrategist: updated.clientStrategist ?? null,
        services: JSON.stringify(services),
        proposalId: id,
        status: "active",
      });
      await seedDefaultTasks(id);
    }
  }

  res.json(formatProposal(updated));
});

router.delete("/proposals/:id", async (req, res) => {
  const parsed = DeleteProposalParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parsed.data;
  const deleted = await db
    .delete(proposalsTable)
    .where(eq(proposalsTable.uuid, id))
    .returning();

  if (!deleted[0]) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  res.status(204).send();
});

router.post("/proposals/:id/accept", async (req, res) => {
  const paramsParsed = AcceptProposalParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = AcceptProposalBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Signature data required" });
    return;
  }

  const { id } = paramsParsed.data;
  const { signatureData, selectedTier } = bodyParsed.data;

  const [updated] = await db
    .update(proposalsTable)
    .set({
      status: "accepted",
      signatureData,
      signedAt: new Date(),
      updatedAt: new Date(),
      ...(selectedTier !== undefined && selectedTier !== null ? { selectedTier } : {}),
    })
    .where(eq(proposalsTable.uuid, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  // Create onboarding_client record (idempotent — keyed by proposalId)
  const existingClient = await db
    .select()
    .from(onboardingClientsTable)
    .where(eq(onboardingClientsTable.proposalId, id))
    .limit(1);

  let onboardingId = id; // default: use proposal UUID so existing tasks still link
  if (existingClient.length === 0) {
    const services = updated.projectType === "web"
      ? ["website"]
      : updated.projectType === "marketing" || updated.projectType === "tiered"
        ? ["marketing"]
        : updated.projectType === "print"
          ? ["print"]
          : [];
    const [newClient] = await db.insert(onboardingClientsTable).values({
      uuid: id, // use proposal UUID for backward compat with existing tasks
      clientName: updated.clientName,
      businessName: updated.businessName,
      clientEmail: updated.clientEmail,
      clientStrategist: updated.clientStrategist ?? null,
      services: JSON.stringify(services),
      proposalId: id,
      status: "active",
    }).returning();
    onboardingId = newClient.uuid;
  } else {
    onboardingId = existingClient[0].uuid;
  }

  // Seed default onboarding tasks (only if not already seeded)
  const existingTasks = await db
    .select()
    .from(onboardingTasksTable)
    .where(eq(onboardingTasksTable.proposalUuid, onboardingId))
    .limit(1);
  if (existingTasks.length === 0) {
    await seedDefaultTasks(onboardingId);
  }

  // Notify strategist of acceptance
  sendProposalAcceptedEmail({
    clientName: updated.clientName,
    businessName: updated.businessName ?? updated.clientName,
    proposalUuid: updated.uuid ?? String(updated.id),
    clientStrategist: updated.clientStrategist,
    selectedTier: updated.selectedTier,
  }).catch(() => {});

  // Send confirmation to client
  if (updated.clientEmail) {
    sendProposalAcceptedClientEmail({
      clientName: updated.clientName,
      businessName: updated.businessName ?? updated.clientName,
      clientEmail: updated.clientEmail,
      selectedTier: updated.selectedTier,
    }).catch(() => {});
  }

  res.json(formatProposal(updated));
});

router.post("/proposals/:id/view", async (req, res) => {
  const parsed = RecordProposalViewParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parsed.data;

  const existing = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.uuid, id))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const [updated] = await db
    .update(proposalsTable)
    .set({
      viewCount: (existing[0].viewCount ?? 0) + 1,
      lastViewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(proposalsTable.uuid, id))
    .returning();

  // Send email notification on first view only
  if ((existing[0].viewCount ?? 0) === 0) {
    sendProposalViewedEmail({
      clientName: updated.clientName,
      businessName: updated.businessName ?? updated.clientName,
      proposalUuid: updated.uuid ?? String(updated.id),
      clientStrategist: updated.clientStrategist,
    }).catch(() => {});
  }

  // Use public formatter: this endpoint is consumed by the client portal to track views
  res.json(formatProposalPublic(updated));
});

router.patch("/onboarding-tasks/:taskId", async (req, res) => {
  const paramsParsed = ToggleOnboardingTaskParams.safeParse({
    taskId: Number(req.params.taskId),
  });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid taskId" });
    return;
  }

  const bodyParsed = ToggleOnboardingTaskBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { taskId } = paramsParsed.data;
  const { completed, sortOrder } = bodyParsed.data;

  const updateFields: Partial<typeof onboardingTasksTable.$inferInsert> = {};
  if (completed !== undefined) updateFields.completed = completed;
  if (sortOrder !== undefined) updateFields.sortOrder = sortOrder;

  if (Object.keys(updateFields).length === 0) {
    res.status(400).json({ error: "At least one of completed or sortOrder must be provided" });
    return;
  }

  const [updated] = await db
    .update(onboardingTasksTable)
    .set(updateFields)
    .where(eq(onboardingTasksTable.id, taskId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(updated));
});

router.delete("/onboarding-tasks/:taskId", async (req, res) => {
  const paramsParsed = DeleteOnboardingTaskParams.safeParse({
    taskId: Number(req.params.taskId),
  });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid taskId" });
    return;
  }

  const { taskId } = paramsParsed.data;
  const deleted = await db
    .delete(onboardingTasksTable)
    .where(eq(onboardingTasksTable.id, taskId))
    .returning();

  if (!deleted[0]) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.status(204).send();
});

// ── Onboarding Clients (standalone onboarding entities) ───────────────────────

router.get("/onboarding-clients", async (_req, res) => {
  const clients = await db
    .select()
    .from(onboardingClientsTable)
    .orderBy(desc(onboardingClientsTable.createdAt));
  res.json(clients.map(formatOnboardingClient));
});

router.post("/onboarding-clients", async (req, res) => {
  const parsed = CreateOnboardingClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const uuid = randomUUID();

  const [client] = await db.insert(onboardingClientsTable).values({
    uuid,
    clientName: data.clientName,
    businessName: data.businessName,
    clientEmail: data.clientEmail ?? null,
    clientStrategist: data.clientStrategist ?? null,
    services: JSON.stringify(data.services),
    status: "active",
  }).returning();

  // Seed default onboarding tasks for the new client
  await seedDefaultTasks(uuid);

  res.status(201).json(formatOnboardingClient(client));
});

router.delete("/onboarding-clients/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await db
    .delete(onboardingClientsTable)
    .where(eq(onboardingClientsTable.uuid, id))
    .returning();

  if (!deleted[0]) {
    res.status(404).json({ error: "Onboarding client not found" });
    return;
  }

  // Also remove associated tasks
  await db.delete(onboardingTasksTable).where(eq(onboardingTasksTable.proposalUuid, id));

  res.status(204).send();
});

export default router;
