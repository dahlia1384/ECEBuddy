import { Router } from "express";
import { runChat, type ChatMessage } from "../agent.js";
import { isEceTopic } from "../topics.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const { messages, topic } = req.body as { messages?: ChatMessage[]; topic?: string };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  const validTopic = typeof topic === "string" && isEceTopic(topic) ? topic : undefined;

  try {
    const reply = await runChat(messages, validTopic);
    res.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
