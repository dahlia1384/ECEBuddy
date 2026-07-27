import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp, uniqueUsername } from "../test/helpers.js";

const mockRunChat = vi.fn();

vi.mock("../agent.js", () => ({
  runChat: mockRunChat,
  isAttachmentMimeType: (v: string) =>
    ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif", "application/pdf"].includes(v),
}));

describe("POST /api/chat", () => {
  let app: Express;
  let cleanup: () => void;
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    ({ app, cleanup } = await createTestApp());
    agent = request.agent(app);
    await agent.post("/api/auth/signup").send({ username: uniqueUsername(), password: "password123" });
  });

  afterAll(() => cleanup());

  beforeEach(() => {
    mockRunChat.mockReset();
    mockRunChat.mockResolvedValue("mocked reply");
  });

  it("rejects requests without a session", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "hi" }] });
    expect(res.status).toBe(401);
  });

  it("rejects an empty messages array", async () => {
    const res = await agent.post("/api/chat").send({ messages: [] });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid message role", async () => {
    const res = await agent.post("/api/chat").send({ messages: [{ role: "system", content: "hi" }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid message role/);
  });

  it("rejects an unsupported attachment mime type", async () => {
    const res = await agent.post("/api/chat").send({
      messages: [{ role: "user", content: "hi", attachments: [{ mimeType: "application/zip", data: "abc" }] }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported attachment type/);
  });

  it("rejects more than 4 attachments on one message", async () => {
    const attachments = Array.from({ length: 5 }, () => ({ mimeType: "image/png", data: "abc" }));
    const res = await agent.post("/api/chat").send({ messages: [{ role: "user", content: "hi", attachments }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at most 4 attachments/);
  });

  it("rejects an attachment over the size limit", async () => {
    const hugeData = "a".repeat(11_000_001);
    const res = await agent.post("/api/chat").send({
      messages: [{ role: "user", content: "hi", attachments: [{ mimeType: "image/png", data: hugeData }] }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too large/);
  });

  it("accepts a valid request and returns the model's reply", async () => {
    const res = await agent
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "What is Ohm's law?" }], topic: "Circuit Analysis" });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("mocked reply");
    expect(mockRunChat).toHaveBeenCalledWith(
      [{ role: "user", content: "What is Ohm's law?" }],
      "Circuit Analysis"
    );
  });

  it("drops an invalid topic instead of passing it through", async () => {
    await agent
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "hi" }], topic: "Interpretive Dance" });

    expect(mockRunChat).toHaveBeenCalledWith([{ role: "user", content: "hi" }], undefined);
  });

  it("returns 500 with the error message when runChat throws", async () => {
    mockRunChat.mockRejectedValue(new Error("model is overloaded"));

    const res = await agent.post("/api/chat").send({ messages: [{ role: "user", content: "hi" }] });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("model is overloaded");
  });
});
