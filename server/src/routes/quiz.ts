import { Router } from "express";
import { generateQuiz } from "../agent.js";
import { isEceTopic } from "../topics.js";

export const quizRouter = Router();

const DIFFICULTIES = ["intro", "intermediate", "advanced"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

quizRouter.post("/", async (req, res) => {
  const { topic, difficulty, count } = req.body as {
    topic?: string;
    difficulty?: string;
    count?: number;
  };

  if (typeof topic !== "string" || !isEceTopic(topic)) {
    res.status(400).json({ error: "topic must be a valid ECE topic" });
    return;
  }
  const resolvedDifficulty: Difficulty = isDifficulty(difficulty) ? difficulty : "intermediate";
  const resolvedCount = Number.isInteger(count) && count! > 0 && count! <= 10 ? count! : 5;

  try {
    const questions = await generateQuiz(topic, resolvedDifficulty, resolvedCount);
    res.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
