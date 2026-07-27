import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  class GoogleGenAI {
    models = { generateContent: mockGenerateContent };
  }
  return { GoogleGenAI };
});

const { runChat, generateQuiz } = await import("./agent.js");

beforeEach(() => {
  mockGenerateContent.mockReset();
  process.env.GEMINI_API_KEY = "test-key";
});

describe("runChat", () => {
  it("returns the model's text response", async () => {
    mockGenerateContent.mockResolvedValue({ text: "Ohm's law is V = IR." });

    const reply = await runChat([{ role: "user", content: "What is Ohm's law?" }]);

    expect(reply).toBe("Ohm's law is V = IR.");
  });

  it("passes the topic into the system instruction", async () => {
    mockGenerateContent.mockResolvedValue({ text: "reply" });

    await runChat([{ role: "user", content: "hi" }], "Circuit Analysis");

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toContain("Circuit Analysis");
  });

  it("maps attachments to inlineData parts and assistant role to 'model'", async () => {
    mockGenerateContent.mockResolvedValue({ text: "reply" });

    await runChat([
      { role: "user", content: "look at this", attachments: [{ mimeType: "image/png", data: "YmFzZTY0" }] },
      { role: "assistant", content: "ok" },
    ]);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.contents[0].role).toBe("user");
    expect(call.contents[0].parts[0]).toEqual({ inlineData: { mimeType: "image/png", data: "YmFzZTY0" } });
    expect(call.contents[1].role).toBe("model");
  });

  it("disables extended thinking", async () => {
    mockGenerateContent.mockResolvedValue({ text: "reply" });

    await runChat([{ role: "user", content: "hi" }]);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it("throws a cleaned error message when the API call fails", async () => {
    mockGenerateContent.mockRejectedValue(
      new Error('{"error":{"code":429,"message":"Resource exhausted"}}')
    );

    await expect(runChat([{ role: "user", content: "hi" }])).rejects.toThrow("Resource exhausted");
  });

  it("falls back to the raw message when the error isn't JSON", async () => {
    mockGenerateContent.mockRejectedValue(new Error("network down"));

    await expect(runChat([{ role: "user", content: "hi" }])).rejects.toThrow("network down");
  });
});

describe("generateQuiz", () => {
  const validPayload = {
    questions: [
      { question: "Q1", choices: ["A", "B", "C", "D"], correctIndex: 1, explanation: "because" },
    ],
  };

  it("parses a valid JSON response into questions", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(validPayload) });

    const questions = await generateQuiz("Circuit Analysis", "intermediate", 1);

    expect(questions).toEqual(validPayload.questions);
  });

  it("throws when the model returns invalid JSON", async () => {
    mockGenerateContent.mockResolvedValue({ text: "not json at all" });

    await expect(generateQuiz("Circuit Analysis", "intro", 1)).rejects.toThrow(
      "Model did not return valid JSON for the quiz."
    );
  });

  it("returns an empty array when the JSON has no questions field", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    const questions = await generateQuiz("Circuit Analysis", "intro", 1);

    expect(questions).toEqual([]);
  });

  it("propagates a cleaned error when the API call fails", async () => {
    mockGenerateContent.mockRejectedValue(
      new Error('{"error":{"message":"model is overloaded"}}')
    );

    await expect(generateQuiz("Circuit Analysis", "intro", 1)).rejects.toThrow("model is overloaded");
  });
});
