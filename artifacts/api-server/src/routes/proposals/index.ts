import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, proposalsTable } from "@workspace/db";
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
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

function formatProposal(p: typeof proposalsTable.$inferSelect) {
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
    viewCount: p.viewCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
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

  const systemPrompt = `You are a senior strategist at McWilliams Media, a premium digital marketing agency. 
You craft high-stakes, cinematic proposal documents that close deals.
Your writing is authoritative, specific, and vision-focused.
Write in flowing paragraphs, not bullet points. Use strategic language that speaks to business outcomes.
Format your response in Markdown with clear sections.`;

  const projectLabel = projectType === "web" || projectType === "website" ? "website" : projectType === "marketing" ? "marketing strategy" : "print materials";

  const userPrompt = `Create a complete strategic proposal for ${clientName} at ${businessName}.

Project Type: ${projectType}
${specialContext ? `Special Context & Notes: ${specialContext}` : ""}

Write a full proposal with these sections:
# Strategic Vision
A compelling 2-3 paragraph overview of the transformation we'll achieve together.

## The Discovery Process
How we'll uncover deep insights about their business, audience, and competitive landscape.

## Design & Development Framework
Our approach to building their ${projectLabel} — methodology, tools, quality standards.

## Deliverables
Specific outcomes and deliverables they can expect from this engagement.

## Timeline & Next Steps
What the timeline looks like and what happens after they sign.

## Why McWilliams Media
A closing paragraph on why we're the right partner for this specific vision.

Keep the tone confident, premium, and strategic. Speak to business outcomes, not just technical features.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
      ],
      config: { maxOutputTokens: 8192 },
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
      status: "draft",
    })
    .returning();

  res.status(201).json(formatProposal(proposal));
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

  res.json(formatProposal(proposal[0]));
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

  const [updated] = await db
    .update(proposalsTable)
    .set(updateData)
    .where(eq(proposalsTable.uuid, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Proposal not found" });
    return;
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
  const { signatureData } = bodyParsed.data;

  const [updated] = await db
    .update(proposalsTable)
    .set({
      status: "accepted",
      signatureData,
      signedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(proposalsTable.uuid, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Proposal not found" });
    return;
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
      updatedAt: new Date(),
    })
    .where(eq(proposalsTable.uuid, id))
    .returning();

  res.json(formatProposal(updated));
});

export default router;
