import { Router } from "express";
import { runChat, isAttachmentMimeType, type ChatMessage } from "../agent.js";
import { isEceTopic } from "../topics.js";

export const chatRouter = Router();

const MAX_ATTACHMENTS_PER_MESSAGE = 4;
const MAX_ATTACHMENT_BASE64_LENGTH = 11_000_000; // ~8MB raw file

function validationError(messages: ChatMessage[]): string | null {
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") return "invalid message role";
    if (typeof m.content !== "string") return "message content must be a string";
    if (!m.attachments) continue;
    if (!Array.isArray(m.attachments)) return "attachments must be an array";
    if (m.attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      return `a message may have at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments`;
    }
    for (const a of m.attachments) {
      if (typeof a.mimeType !== "string" || !isAttachmentMimeType(a.mimeType)) {
        return `unsupported attachment type: ${a.mimeType}`;
      }
      if (typeof a.data !== "string" || a.data.length === 0) {
        return "attachment data must be a non-empty base64 string";
      }
      if (a.data.length > MAX_ATTACHMENT_BASE64_LENGTH) {
        return "attachment is too large (max ~8MB per file)";
      }
    }
  }
  return null;
}

chatRouter.post("/", async (req, res) => {
  const { messages, topic } = req.body as { messages?: ChatMessage[]; topic?: string };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  const invalidReason = validationError(messages);
  if (invalidReason) {
    res.status(400).json({ error: invalidReason });
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
