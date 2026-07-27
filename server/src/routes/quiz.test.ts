import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp, uniqueUsername } from "../test/helpers.js";

const mockGenerateQuiz = vi.fn();

vi.mock("../agent.js", () => ({
  generateQuiz: mockGenerateQuiz,
}));

const SAMPLE_QUESTIONS = [
  { question: "Q1", choices: ["A", "B", "C", "D"], correctIndex: 0, explanation: "because" },
];

describe("POST /api/quiz", () => {
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
    mockGenerateQuiz.mockReset();
    mockGenerateQuiz.mockResolvedValue(SAMPLE_QUESTIONS);
  });

  it("rejects requests without a session", async () => {
    const res = await request(app).post("/api/quiz").send({ topic: "Circuit Analysis" });
    expect(res.status).toBe(401);
  });

  it("rejects a missing/invalid topic", async () => {
    const res = await agent.post("/api/quiz").send({ topic: "Not A Real Topic" });
    expect(res.status).toBe(400);
  });

  it("defaults difficulty to intermediate and count to 5", async () => {
    await agent.post("/api/quiz").send({ topic: "Circuit Analysis" });
    expect(mockGenerateQuiz).toHaveBeenCalledWith("Circuit Analysis", "intermediate", 5);
  });

  it("clamps an out-of-range count back to the default", async () => {
    await agent.post("/api/quiz").send({ topic: "Circuit Analysis", count: 999 });
    expect(mockGenerateQuiz).toHaveBeenCalledWith("Circuit Analysis", "intermediate", 5);
  });

  it("passes through a valid difficulty and count", async () => {
    await agent.post("/api/quiz").send({ topic: "Circuit Analysis", difficulty: "advanced", count: 3 });
    expect(mockGenerateQuiz).toHaveBeenCalledWith("Circuit Analysis", "advanced", 3);
  });

  it("returns the generated questions", async () => {
    const res = await agent.post("/api/quiz").send({ topic: "Circuit Analysis" });
    expect(res.status).toBe(200);
    expect(res.body.questions).toEqual(SAMPLE_QUESTIONS);
  });

  it("returns 500 with the error message when generation fails", async () => {
    mockGenerateQuiz.mockRejectedValue(new Error("Model did not return valid JSON for the quiz."));
    const res = await agent.post("/api/quiz").send({ topic: "Circuit Analysis" });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Model did not return valid JSON for the quiz.");
  });
});
