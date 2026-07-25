export const ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

export type AttachmentMimeType = (typeof ATTACHMENT_MIME_TYPES)[number];

export interface Attachment {
  mimeType: AttachmentMimeType;
  data: string;
  name?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

export async function fetchTopics(): Promise<string[]> {
  const res = await fetch("/api/topics");
  if (!res.ok) throw new Error("Failed to load topics");
  const data = await res.json();
  return data.topics as string[];
}

export async function sendChat(messages: ChatMessage[], topic?: string): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, topic }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Chat request failed");
  return data.reply as string;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export async function fetchQuiz(
  topic: string,
  difficulty: "intro" | "intermediate" | "advanced",
  count: number
): Promise<QuizQuestion[]> {
  const res = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, difficulty, count }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Quiz request failed");
  return data.questions as QuizQuestion[];
}
