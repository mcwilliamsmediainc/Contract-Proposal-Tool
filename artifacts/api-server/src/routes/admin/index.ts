import { Router } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db, proposalsTable, contractsTable, onboardingClientsTable } from "@workspace/db";

function formatProposalAdmin(p: typeof proposalsTable.$inferSelect) {
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
    clientStrategist: p.clientStrategist ?? null,
    notes: p.notes ?? null,
    viewCount: p.viewCount,
    lastViewedAt: p.lastViewedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const router = Router();

router.get("/admin/clients", async (req, res) => {
  const [proposals, contracts, onboardingClients] = await Promise.all([
    db.select().from(proposalsTable).orderBy(proposalsTable.createdAt),
    db.select().from(contractsTable),
    db.select().from(onboardingClientsTable),
  ]);

  const contractByProposal = new Map(
    contracts.filter((c) => c.proposalId).map((c) => [c.proposalId!, c])
  );
  const onboardingByProposal = new Map(
    onboardingClients.filter((o) => o.proposalId).map((o) => [o.proposalId!, o])
  );

  const clients = proposals.map((p) => {
    const contract = contractByProposal.get(p.uuid) ?? null;
    const onboarding = onboardingByProposal.get(p.uuid) ?? null;

    let stage: string;
    if (onboarding) {
      stage = "onboarding";
    } else if (contract?.status === "signed") {
      stage = "contract_signed";
    } else if (contract?.status === "sent") {
      stage = "contract_sent";
    } else if (contract?.status === "draft") {
      stage = "contract_draft";
    } else if (p.status === "accepted") {
      stage = "proposal_accepted";
    } else if (p.status === "sent") {
      stage = "proposal_sent";
    } else {
      stage = "proposal_draft";
    }

    return {
      id: p.uuid,
      clientName: p.clientName,
      businessName: p.businessName,
      clientEmail: p.clientEmail,
      clientStrategist: p.clientStrategist ?? null,
      proposalId: p.uuid,
      proposalStatus: p.status,
      proposalAmount: Number(p.totalAmount),
      contractId: contract?.uuid ?? null,
      contractStatus: contract?.status ?? null,
      onboardingStatus: onboarding?.status ?? null,
      stage,
      createdAt: p.createdAt.toISOString(),
    };
  });

  res.json(clients);
});

router.get("/admin/proposals/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const proposal = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.uuid, id))
    .limit(1);
  if (!proposal[0]) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  res.json(formatProposalAdmin(proposal[0]));
});

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
