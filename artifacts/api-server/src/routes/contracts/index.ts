import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, contractsTable, onboardingClientsTable, onboardingTasksTable, proposalsTable } from "@workspace/db";
import { sendContractSignedEmail, sendContractSignedClientEmail, sendAchPaymentEmail, sendContractReadyClientEmail, sendOnboardingKickoffEmail } from "../../lib/email";
import {
  CreateContractBody,
  UpdateContractBody,
  SignContractBody,
  GetContractParams,
  UpdateContractParams,
  DeleteContractParams,
  SendContractParams,
  SignContractParams,
  ListContractsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function formatContract(c: typeof contractsTable.$inferSelect) {
  return {
    id: String(c.uuid ?? c.id),
    proposalId: c.proposalId ?? null,
    clientName: c.clientName,
    businessName: c.businessName,
    clientEmail: c.clientEmail,
    contractType: c.contractType,
    totalCost: Number(c.totalCost),
    depositAmount: Number(c.depositAmount),
    remainingBalance: Number(c.remainingBalance),
    hostingOption: c.hostingOption,
    status: c.status,
    signatureData: c.signatureData ?? null,
    signedAt: c.signedAt?.toISOString() ?? null,
    referralSource: c.referralSource ?? null,
    teamMember: c.teamMember ?? null,
    companyAddress: c.companyAddress ?? null,
    companyAddressLine2: c.companyAddressLine2 ?? null,
    companyCity: c.companyCity ?? null,
    companyState: c.companyState ?? null,
    companyZip: c.companyZip ?? null,
    scheduleA: c.scheduleA ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/contracts", async (req, res) => {
  const parsed = ListContractsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  const contracts = await db
    .select()
    .from(contractsTable)
    .where(status ? eq(contractsTable.status, status) : undefined)
    .orderBy(desc(contractsTable.createdAt));

  res.json(contracts.map(formatContract));
});

router.post("/contracts", async (req, res) => {
  const parsed = CreateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const [contract] = await db
    .insert(contractsTable)
    .values({
      uuid: randomUUID(),
      proposalId: data.proposalId ?? null,
      clientName: data.clientName,
      businessName: data.businessName,
      clientEmail: data.clientEmail,
      contractType: data.contractType,
      totalCost: String(data.totalCost ?? 0),
      depositAmount: String(data.depositAmount ?? 0),
      remainingBalance: String(data.remainingBalance ?? 0),
      hostingOption: data.hostingOption ?? "none",
      scheduleA: data.scheduleA ?? null,
      status: "draft",
    })
    .returning();

  res.status(201).json(formatContract(contract));
});

router.get("/contracts/:id", async (req, res) => {
  const parsed = GetContractParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parsed.data;
  const contract = await db
    .select()
    .from(contractsTable)
    .where(eq(contractsTable.uuid, id))
    .limit(1);

  if (!contract[0]) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  res.json(formatContract(contract[0]));
});

router.patch("/contracts/:id", async (req, res) => {
  const paramsParsed = UpdateContractParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateContractBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { id } = paramsParsed.data;
  const data = bodyParsed.data;

  const updateData: Partial<typeof contractsTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.clientName !== undefined) updateData.clientName = data.clientName;
  if (data.businessName !== undefined) updateData.businessName = data.businessName;
  if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
  if (data.contractType !== undefined) updateData.contractType = data.contractType;
  if (data.totalCost !== undefined) updateData.totalCost = String(data.totalCost);
  if (data.depositAmount !== undefined) updateData.depositAmount = String(data.depositAmount);
  if (data.remainingBalance !== undefined) updateData.remainingBalance = String(data.remainingBalance);
  if (data.hostingOption !== undefined) updateData.hostingOption = data.hostingOption;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.scheduleA !== undefined) updateData.scheduleA = data.scheduleA;

  const [updated] = await db
    .update(contractsTable)
    .set(updateData)
    .where(eq(contractsTable.uuid, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  res.json(formatContract(updated));
});

router.delete("/contracts/:id", async (req, res) => {
  const parsed = DeleteContractParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parsed.data;
  const deleted = await db
    .delete(contractsTable)
    .where(eq(contractsTable.uuid, id))
    .returning();

  if (!deleted[0]) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  res.status(204).send();
});

router.post("/contracts/:id/send", async (req, res) => {
  const parsed = SendContractParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { id } = parsed.data;
  const [updated] = await db
    .update(contractsTable)
    .set({ status: "sent", updatedAt: new Date() })
    .where(eq(contractsTable.uuid, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  // Look up strategist from linked proposal if available
  let sendStrategist: string | null = null;
  if (updated.proposalId) {
    const [linkedProposal] = await db
      .select({ clientStrategist: proposalsTable.clientStrategist })
      .from(proposalsTable)
      .where(eq(proposalsTable.uuid, updated.proposalId))
      .limit(1);
    sendStrategist = linkedProposal?.clientStrategist ?? null;
  }

  // Fire client email with contract details
  sendContractReadyClientEmail({
    clientName: updated.clientName,
    businessName: updated.businessName,
    clientEmail: updated.clientEmail,
    contractUuid: updated.uuid ?? String(updated.id),
    contractType: updated.contractType,
    totalCost: Number(updated.totalCost),
    depositAmount: Number(updated.depositAmount),
    clientStrategist: sendStrategist,
  }).catch(() => {});

  res.json(formatContract(updated));
});

router.post("/contracts/:id/sign", async (req, res) => {
  const paramsParsed = SignContractParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = SignContractBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Signature data required" });
    return;
  }

  const { id } = paramsParsed.data;
  const data = bodyParsed.data;

  const [updated] = await db
    .update(contractsTable)
    .set({
      status: "signed",
      signatureData: data.signatureData,
      signedAt: new Date(),
      ...(data.hostingOption ? { hostingOption: data.hostingOption } : {}),
      referralSource: data.referralSource ?? null,
      teamMember: data.teamMember ?? null,
      companyAddress: data.companyAddress ?? null,
      companyAddressLine2: data.companyAddressLine2 ?? null,
      companyCity: data.companyCity ?? null,
      companyState: data.companyState ?? null,
      companyZip: data.companyZip ?? null,
      updatedAt: new Date(),
    })
    .where(eq(contractsTable.uuid, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  // ── Service-ID → onboarding-form key mapping ─────────────────────────────
  const CATEGORY_SERVICE_IDS: Record<string, string[]> = {
    "seo":        ["seo-pro", "seo-plus", "seo-platinum", "seo-blog", "seo-gbp-setup"],
    "google-ads": ["ppc-397", "ppc-497", "ppc-647", "lsa"],
    "sm-ads":     ["sm-ads-497", "sm-ads-597", "sm-ads-697"],
    "sm-posting": ["sm-post-pro", "sm-post-plus", "sm-post-platinum", "sm-video"],
    "email":      ["email-pro", "email-plus", "email-platinum"],
    "brand-shoot":["brand-photos", "brand-photos-video"],
  };
  const CATEGORY_TO_SERVICE: Record<string, string> = {
    "seo":        "marketing.seo",
    "google-ads": "marketing.google_ads",
    "sm-ads":     "marketing.social_media_ads",
    "sm-posting": "marketing.social_media_posting",
    "email":      "marketing.newsletter",
    "brand-shoot":"marketing.brand_shoot",
  };

  // ── Look up linked proposal for strategist + service data ─────────────────
  let clientStrategist: string | null = null;
  let onboardingServices: string[] = [];
  let hasLsa = false;

  if (updated.proposalId) {
    const [linkedProposal] = await db
      .select({
        clientStrategist: proposalsTable.clientStrategist,
        selectedTier: proposalsTable.selectedTier,
        projectType: proposalsTable.projectType,
      })
      .from(proposalsTable)
      .where(eq(proposalsTable.uuid, updated.proposalId))
      .limit(1);

    clientStrategist = linkedProposal?.clientStrategist ?? null;

    if (linkedProposal?.projectType === "ala-carte" && linkedProposal?.selectedTier) {
      try {
        const selectedIds = JSON.parse(linkedProposal.selectedTier) as string[];
        hasLsa = selectedIds.includes("lsa");
        for (const [catId, serviceIds] of Object.entries(CATEGORY_SERVICE_IDS)) {
          if (serviceIds.some(sid => selectedIds.includes(sid))) {
            onboardingServices.push(CATEGORY_TO_SERVICE[catId]);
          }
        }
      } catch { /* fall through to defaults */ }
    }
  }

  // For contracts with no ala-carte proposal, fall back to broad type-based services
  if (onboardingServices.length === 0) {
    if (updated.contractType === "marketing" || updated.contractType === "tiered") {
      onboardingServices = ["marketing.google_ads", "marketing.social_media_ads", "marketing.social_media_posting", "marketing.newsletter"];
    } else if (updated.contractType === "website") {
      onboardingServices = ["website"];
    } else {
      onboardingServices = [updated.contractType];
    }
  }

  // ── Auto-create onboarding_client on signing (idempotent) ─────────────────
  const existingOb = await db
    .select()
    .from(onboardingClientsTable)
    .where(eq(onboardingClientsTable.contractId, id))
    .limit(1);

  let obUuid: string | null = null;

  if (existingOb.length === 0) {
    obUuid = randomUUID();
    await db.insert(onboardingClientsTable).values({
      uuid: obUuid,
      clientName: updated.clientName,
      businessName: updated.businessName,
      clientEmail: updated.clientEmail,
      services: JSON.stringify(onboardingServices),
      contractId: id,
      proposalId: updated.proposalId ?? null,
      status: "active",
    });

    const DEFAULT_TASKS = [
      "Send welcome email",
      "Schedule kickoff call",
      "Collect brand assets",
      "Set up client portal access",
      "Deliver first milestone",
    ];
    await db.insert(onboardingTasksTable).values(
      DEFAULT_TASKS.map((label, idx) => ({
        proposalUuid: obUuid!,
        label,
        sortOrder: idx,
        completed: false,
      }))
    );

    // Send onboarding kickoff email to client
    sendOnboardingKickoffEmail({
      clientName: updated.clientName,
      businessName: updated.businessName,
      clientEmail: updated.clientEmail,
      onboardingUuid: obUuid,
      services: onboardingServices,
      hasLsa,
    }).catch(() => {});
  } else {
    obUuid = existingOb[0].uuid;
  }

  // Notify info@ (always) + strategist (if assigned)
  sendContractSignedEmail({
    clientName: updated.clientName,
    businessName: updated.businessName,
    contractUuid: updated.uuid ?? String(updated.id),
    contractType: updated.contractType,
    totalCost: Number(updated.totalCost),
    clientStrategist,
  }).catch(() => {});

  // Send confirmation to client
  sendContractSignedClientEmail({
    clientName: updated.clientName,
    businessName: updated.businessName,
    clientEmail: updated.clientEmail,
    contractType: updated.contractType,
    totalCost: Number(updated.totalCost),
    depositAmount: Number(updated.depositAmount),
    clientStrategist,
  }).catch(() => {});

  res.json(formatContract(updated));
});

router.post("/contracts/:id/ach", async (req, res) => {
  const { id } = req.params;

  const { accountHolderName, bankName, routingNumber, accountNumber, accountType } = req.body as {
    accountHolderName?: string;
    bankName?: string;
    routingNumber?: string;
    accountNumber?: string;
    accountType?: string;
  };

  if (!accountHolderName || !bankName || !routingNumber || !accountNumber || !accountType) {
    res.status(400).json({ error: "All ACH fields are required" });
    return;
  }

  if (!/^\d{9}$/.test(routingNumber.trim())) {
    res.status(400).json({ error: "Routing number must be 9 digits" });
    return;
  }

  if (!/^\d{4,17}$/.test(accountNumber.trim())) {
    res.status(400).json({ error: "Account number must be 4–17 digits" });
    return;
  }

  try {
    const contract = await db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.uuid, id))
      .limit(1);

    if (!contract[0]) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    const c = contract[0];

    // Send ACH info to info@ — never stored in DB
    sendAchPaymentEmail({
      clientName: c.clientName,
      businessName: c.businessName,
      contractUuid: c.uuid ?? String(c.id),
      totalCost: Number(c.totalCost),
      depositAmount: Number(c.depositAmount),
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      routingNumber: routingNumber.trim(),
      accountNumber: accountNumber.trim(),
      accountType,
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "ACH submission failed");
    res.status(500).json({ error: "Failed to process ACH submission" });
  }
});

export default router;
