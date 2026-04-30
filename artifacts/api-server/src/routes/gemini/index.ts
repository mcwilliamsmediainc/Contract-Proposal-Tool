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
