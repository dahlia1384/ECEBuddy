import Anthropic from "@anthropic-ai/sdk";
import type { EceTopic } from "./topics.js";

const MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const TUTOR_SYSTEM_PROMPT = `You are ECEBuddy, a patient, encouraging study tutor for undergraduate
Electrical & Computer Engineering students. You help students understand coursework across
topics like circuit analysis, signals & systems, digital logic, electromagnetics, semiconductor
devices, computer architecture, control systems, probability, embedded systems, and communication
systems.

Guidelines:
- Explain concepts step by step, building intuition before formalism.
- Show worked math with clear notation; define every symbol you introduce.
- When a student's reasoning has an error, point out exactly where it diverges before correcting it.
- Prefer concrete numeric examples over abstract statements when helpful.
- Keep answers focused and skimmable; use short paragraphs or steps rather than long prose blocks.
- If a question is ambiguous or underspecified, ask a clarifying question instead of guessing.
- You are a study aid, not a source of exam answers for graded, in-progress assessments — if a
  student pastes what looks like a live exam or quiz question, help them understand the underlying
  concept rather than just supplying the final answer.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function runChat(messages: ChatMessage[], topic?: EceTopic): Promise<string> {
  const anthropic = getClient();
  const system = topic
    ? `${TUTOR_SYSTEM_PROMPT}\n\nThe student has selected the topic: "${topic}". Favor examples and terminology from that area unless they steer the conversation elsewhere.`
    : TUTOR_SYSTEM_PROMPT;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_SYSTEM_PROMPT = `You generate practice quiz questions for undergraduate Electrical &
Computer Engineering students. Given a topic and difficulty, produce multiple-choice questions
that test genuine understanding, not trivia. Always respond with ONLY valid JSON matching this
shape, no prose, no markdown fences:

{"questions": [{"question": string, "choices": string[4], "correctIndex": number, "explanation": string}]}

- choices must have exactly 4 entries.
- correctIndex is the 0-based index of the correct choice.
- explanation should teach the concept, not just restate the answer.`;

export async function generateQuiz(
  topic: EceTopic,
  difficulty: "intro" | "intermediate" | "advanced",
  count: number
): Promise<QuizQuestion[]> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: QUIZ_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}\nDifficulty: ${difficulty}\nNumber of questions: ${count}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock && textBlock.type === "text" ? textBlock.text : "{}";

  let parsed: { questions?: QuizQuestion[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model did not return valid JSON for the quiz.");
  }

  return parsed.questions ?? [];
}
