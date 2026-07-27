import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTopics, sendChat, fetchQuiz } from "./api";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("fetchTopics", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("returns the topics array on success", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ topics: ["Circuit Analysis", "Signals & Systems"] })
    );

    await expect(fetchTopics()).resolves.toEqual(["Circuit Analysis", "Signals & Systems"]);
  });

  it("throws a generic error on a failed response", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}, false));

    await expect(fetchTopics()).rejects.toThrow("Failed to load topics");
  });
});

describe("sendChat", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("posts messages and topic, returning the reply", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse({ reply: "Ohm's law is V = IR." }));

    const reply = await sendChat([{ role: "user", content: "What is Ohm's law?" }], "Circuit Analysis");

    expect(reply).toBe("Ohm's law is V = IR.");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      messages: [{ role: "user", content: "What is Ohm's law?" }],
      topic: "Circuit Analysis",
    });
  });

  it("throws the server's error message when the request fails", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "model is overloaded" }, false)
    );

    await expect(sendChat([{ role: "user", content: "hi" }])).rejects.toThrow("model is overloaded");
  });

  it("falls back to a generic message when the error field is missing", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}, false));

    await expect(sendChat([{ role: "user", content: "hi" }])).rejects.toThrow("Chat request failed");
  });
});

describe("fetchQuiz", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("posts topic, difficulty, and count, returning questions", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const questions = [{ question: "Q", choices: ["A", "B", "C", "D"], correctIndex: 0, explanation: "E" }];
    fetchMock.mockResolvedValue(jsonResponse({ questions }));

    const result = await fetchQuiz("Circuit Analysis", "advanced", 3);

    expect(result).toEqual(questions);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/quiz");
    expect(JSON.parse(init.body)).toEqual({ topic: "Circuit Analysis", difficulty: "advanced", count: 3 });
  });

  it("throws the server's error message when the request fails", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "topic must be a valid ECE topic" }, false)
    );

    await expect(fetchQuiz("Bogus", "intro", 5)).rejects.toThrow("topic must be a valid ECE topic");
  });
});
