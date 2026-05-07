import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, contractsTable, onboardingClientsTable, onboardingTasksTable, proposalsTable } from "@workspace/db";
import { sendContractSignedEmail, sendContractSignedClientEmail, sendAchPaymentEmail, sendContractReadyClientEmail } from "../../lib/email";
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

  // Fire client email with contract details
  sendContractReadyClientEmail({
    clientName: updated.clientName,
    businessName: updated.businessName,
    clientEmail: updated.clientEmail,
    contractUuid: updated.uuid ?? String(updated.id),
    contractType: updated.contractType,
    totalCost: Number(updated.totalCost),
    depositAmount: Number(updated.depositAmount),
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

  // Auto-create onboarding_client on signing (idempotent — keyed by contractId)
  const existingOb = await db
    .select()
    .from(onboardingClientsTable)
    .where(eq(onboardingClientsTable.contractId, id))
    .limit(1);

  if (existingOb.length === 0) {
    const services = updated.contractType === "website"
      ? ["website"]
      : updated.contractType === "marketing"
        ? ["marketing"]
        : updated.contractType === "print"
          ? ["print"]
          : [updated.contractType];

    const obUuid = randomUUID();
    await db.insert(onboardingClientsTable).values({
      uuid: obUuid,
      clientName: updated.clientName,
      businessName: updated.businessName,
      clientEmail: updated.clientEmail,
      services: JSON.stringify(services),
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
        proposalUuid: obUuid,
        label,
        sortOrder: idx,
        completed: false,
      }))
    );
  }

  // Look up linked proposal to get the assigned client strategist
  let clientStrategist: string | null = null;
  if (updated.proposalId) {
    const [linkedProposal] = await db
      .select({ clientStrategist: proposalsTable.clientStrategist })
      .from(proposalsTable)
      .where(eq(proposalsTable.uuid, updated.proposalId))
      .limit(1);
    clientStrategist = linkedProposal?.clientStrategist ?? null;
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
