import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { ai } from "@workspace/integrations-gemini-ai";
import { generateImage } from "@workspace/integrations-gemini-ai/image";
import {
  CreateGeminiConversationBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
  SendGeminiMessageBody,
  GenerateGeminiImageBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/gemini/conversations", async (req, res) => {
  const convs = await db
    .select()
    .from(conversations)
    .orderBy(conversations.createdAt);

  res.json(
    convs.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});

router.post("/gemini/conversations", async (req, res) => {
  const parsed = CreateGeminiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [conv] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/gemini/conversations/:id", async (req, res) => {
  const parsed = GetGeminiConversationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const conv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, parsed.data.id))
    .limit(1);

  if (!conv[0]) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, parsed.data.id))
    .orderBy(messages.createdAt);

  res.json({
    id: conv[0].id,
    title: conv[0].title,
    createdAt: conv[0].createdAt.toISOString(),
    messages: msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.delete("/gemini/conversations/:id", async (req, res) => {
  const parsed = DeleteGeminiConversationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await db
    .delete(conversations)
    .where(eq(conversations.id, parsed.data.id))
    .returning();

  if (!deleted[0]) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.status(204).send();
});

router.get("/gemini/conversations/:id/messages", async (req, res) => {
  const parsed = ListGeminiMessagesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, parsed.data.id))
    .orderBy(messages.createdAt);

  res.json(
    msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  );
});

router.post("/gemini/conversations/:id/messages", async (req, res) => {
  const paramsParsed = SendGeminiMessageParams.safeParse(req.params);
  const bodyParsed = SendGeminiMessageBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const convId = paramsParsed.data.id;
  const userContent = bodyParsed.data.content;

  await db.insert(messages).values({
    conversationId: convId,
    role: "user",
    content: userContent,
  });

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(messages.createdAt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const stream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: { maxOutputTokens: 8192 },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: convId,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

// ── AI Review — context-aware streaming analysis ──────────────────────────────

router.post("/gemini/review", async (req, res) => {
  const { type, data, history, userMessage } = req.body as {
    type: "proposal" | "contract" | "onboarding";
    data: Record<string, unknown>;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    userMessage?: string;
  };

  if (!type || !data) {
    res.status(400).json({ error: "type and data are required" });
    return;
  }

  // ── Chat follow-up ──────────────────────────────────────────────────────────
  if (typeof userMessage === "string") {
    const historyArr = history ?? [];
    const contextNote = `You are a senior strategist at McWilliams Media. You previously reviewed a ${type} and the team member has a follow-up question. Here is the data about the ${type} you reviewed:\n\n${JSON.stringify(data, null, 2)}\n\nAnswer the follow-up question based on your expertise and the context above. Be specific, helpful, and concise. Use markdown where it helps readability.`;

    const contents = [
      { role: "user" as const, parts: [{ text: contextNote }] },
      ...historyArr.map(m => ({
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: m.content }],
      })),
      { role: "user" as const, parts: [{ text: userMessage }] },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents,
        config: { maxOutputTokens: 2048 },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    } catch (err) {
      req.log.error({ err }, "AI review chat failed");
      res.write(`data: ${JSON.stringify({ content: "\n\n*Something went wrong. Please try again.*" })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  }

  let prompt = "";

  if (type === "proposal") {
    const p = data as {
      clientName?: string; businessName?: string; projectType?: string;
      totalAmount?: number; pricingItems?: string; content?: string; specialContext?: string;
      numberOfPages?: number; pageNames?: string; status?: string;
      selectedTier?: string; clientStrategist?: string;
    };

    // Parse pricing items — actual fields: desc, rate, qty, price
    type PricingItem = { desc?: string; rate?: number; qty?: string; price: number };
    let parsedItems: PricingItem[] = [];
    try {
      if (p.pricingItems) parsedItems = JSON.parse(p.pricingItems) as PricingItem[];
    } catch { /* keep empty */ }

    const itemsSum = parsedItems.reduce((s, r) => s + Number(r.price), 0);
    const statedTotal = Number(p.totalAmount ?? 0);
    const effectiveTotal = statedTotal || itemsSum;

    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const pricingBlock = parsedItems.length > 0
      ? parsedItems.map(item => {
          const desc = item.desc ?? "⚠ No description";
          const rate = item.rate != null ? `$${Number(item.rate).toLocaleString()}/unit` : "—";
          const qty  = item.qty ?? "1 Unit";
          const price = `$${fmt(Number(item.price))}`;
          return `  | ${desc} | Rate: ${rate} | Qty: ${qty} | Line Total: ${price} |`;
        }).join("\n") +
        `\n\n  Items sum: $${fmt(itemsSum)}` +
        `\n  Stated total override: ${statedTotal > 0 ? `$${fmt(statedTotal)}` : "none (using item sum)"}` +
        (Math.abs(itemsSum - statedTotal) > 0.01 && statedTotal > 0
          ? `\n  ⚠ MATH MISMATCH — items sum to $${fmt(itemsSum)} but stated total is $${fmt(statedTotal)}`
          : `\n  ✓ Totals check out`)
      : "  ⚠ No pricing line items defined — proposal shows $0";

    const pageList = p.pageNames
      ? p.pageNames.split("|").map(pg => `  • ${pg.trim()}`).join("\n")
      : "  ⚠ None provided";

    prompt = `You are a senior strategist and editor at McWilliams Media reviewing a client proposal before it is sent. You are thorough, exacting, and direct. Use markdown with headers. Be specific — quote exact text for every issue you find.

---
**FULL PROPOSAL DATA FOR REVIEW:**

CLIENT & PROJECT
- Client Name: ${p.clientName ?? "⚠ MISSING"}
- Business Name: ${p.businessName ?? "⚠ MISSING"}
- Project Type: ${p.projectType ?? "⚠ MISSING"}
- Assigned Strategist: ${p.clientStrategist ?? "⚠ UNASSIGNED — no one owns this"}
- Proposal Status: ${p.status ?? "draft"}
${p.selectedTier ? `- Selected Tier: ${p.selectedTier}` : ""}

WEBSITE SCOPE
- Number of Pages: ${p.numberOfPages ?? "⚠ NOT SET"}
- Pages Included:
${pageList}

PRICING BREAKDOWN (each line: Description | Rate | Qty | Line Total)
${pricingBlock}
→ TOTAL INVESTMENT shown to client: $${fmt(effectiveTotal)}
→ Contract deposit (50%): $${fmt(effectiveTotal * 0.5)} | Remaining (50%): $${fmt(effectiveTotal * 0.5)}

INTERNAL CONTEXT & NOTES (not shown to client)
${p.specialContext?.trim() ? p.specialContext.trim() : "⚠ NONE PROVIDED — strategist has given us nothing to personalise this proposal with"}

PROPOSAL BODY / PROJECT NARRATIVE (the main written content the client reads)
${p.content?.trim() ? p.content.trim() : "⚠ COMPLETELY BLANK — no narrative, no problem statement, no value prop, nothing"}

---
Now review ALL of the following areas thoroughly:

## 1. Overall Readiness
Is this proposal ready to send TODAY? Give a clear yes/no and one sentence explaining why.

## 2. Client Experience & First Impression
If ${p.clientName ?? "the client"} at ${p.businessName ?? "their company"} received this right now, what would they think? Be specific about the emotional reaction and professional impression.

## 3. Project Narrative & Problem Statement
Does the proposal body acknowledge the client's specific situation, pain points, or goals? Quote exact weak/missing text and provide sharper alternatives. A great proposal makes the client feel heard before it sells anything.

## 4. Value Proposition
Does the proposal explain WHY McWilliams Media is the right partner for THIS client — not just what we do, but why it matters for their specific business? Flag generic or missing claims.

## 5. Pricing Clarity & Math
- Is every line item clearly described? Flag any vague descriptions (e.g. "1 Unit" with no context).
- Do the numbers add up correctly?
- Is the rate/qty/price relationship unambiguous for each line?
- Are any items $0 or suspiciously priced?

## 6. Spelling, Grammar & Professionalism
Read every word. Quote every error with its correction. If none, say "No issues found."

## 7. Completeness Checklist
Check each of these and flag any that are missing or weak:
- [ ] Client name & business name
- [ ] Assigned strategist
- [ ] Number of pages + named page list
- [ ] Internal context / special notes
- [ ] Written proposal narrative
- [ ] All pricing line items described
- [ ] Total matches line items

## 8. Prioritised Action Items
List the top 3–5 fixes needed before this proposal should be sent, in order of urgency. Be specific — name the exact field or section that needs work.`;
  } else if (type === "contract") {
    const c = data as {
      clientName?: string; businessName?: string; contractType?: string;
      totalCost?: number; depositAmount?: number; remainingBalance?: number;
      hostingOption?: string; scheduleA?: string; status?: string;
    };
    prompt = `You are a senior strategist at McWilliams Media reviewing a client contract before it's sent. Be specific and practical. Use markdown with headers.

Review this contract and provide:

## Completeness
Is all required information filled in? Note any blank or suspicious fields.

## Scope of Work (Schedule A)
Is the project scope clear, comprehensive, and specific enough to protect both parties?

## Financial Terms
Do the numbers make sense? Deposit, total cost, remaining balance — any concerns?

## Risk Flags
Any unclear terms, missing clauses, or potential issues?

## Readiness
Is this contract ready to send, or does it need work first?

---
**Contract Data:**
- Client: ${c.clientName ?? "Unknown"} at ${c.businessName ?? "Unknown"}
- Type: ${c.contractType ?? "Unknown"}
- Total: $${c.totalCost ?? 0} | Deposit: $${c.depositAmount ?? 0} | Remaining: $${c.remainingBalance ?? 0}
- Hosting: ${c.hostingOption ?? "none"}
- Status: ${c.status ?? "draft"}
${c.scheduleA ? `\n**Schedule A — Scope of Work:**\n${c.scheduleA}` : "\n*(No scope of work written yet)*"}`;
  } else if (type === "onboarding") {
    const o = data as {
      clientName?: string; businessName?: string; services?: string[];
      clientStrategist?: string; status?: string; createdAt?: string;
      tasks?: Array<{ label: string; completed: boolean }>;
    };
    const tasks = o.tasks ?? [];
    const done = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed);
    prompt = `You are a senior strategist at McWilliams Media reviewing an active client onboarding. Be direct and practical. Use markdown with headers.

Review this onboarding and provide:

## Progress Summary
Where is this client in the onboarding process? Is the pace on track?

## Blockers & Risks
Which pending tasks are most critical? Any red flags?

## Next Priority
What single action should the strategist take today?

## Client Experience
Based on what's completed and pending, is this client likely having a positive onboarding experience?

## Recommendations
2–3 specific actions to keep this onboarding moving smoothly.

---
**Onboarding Data:**
- Client: ${o.clientName ?? "Unknown"} at ${o.businessName ?? "Unknown"}
- Services: ${(o.services ?? []).join(", ") || "None"}
- Strategist: ${o.clientStrategist ?? "Unassigned"}
- Started: ${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "Unknown"}
- Progress: ${done.length}/${tasks.length} tasks complete

**Completed Tasks:**
${done.length > 0 ? done.map(t => `✓ ${t.label}`).join("\n") : "*(none)*"}

**Pending Tasks:**
${pending.length > 0 ? pending.map(t => `○ ${t.label}`).join("\n") : "*(none)*"}`;
  } else {
    res.status(400).json({ error: "Invalid review type" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 4096 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
  } catch (err) {
    req.log.error({ err }, "AI review generation failed");
    res.write(`data: ${JSON.stringify({ content: "\n\n*Review failed — please try again.*" })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/gemini/generate-image", async (req, res) => {
  const parsed = GenerateGeminiImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { b64_json, mimeType } = await generateImage(parsed.data.prompt);
  res.json({ b64_json, mimeType });
});

export default router;
