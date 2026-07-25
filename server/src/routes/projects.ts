import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

interface SavedFile {
  id: string;
  mimeType: string;
  data: string;
  name?: string;
  savedAt: number;
}

interface SavedChat {
  id: string;
  messages: Array<{ role: "user" | "assistant"; content: string; attachments?: unknown }>;
  savedAt: number;
}

interface SavedQuizAttempt {
  id: string;
  difficulty: string;
  questions: unknown[];
  answers: Record<number, number>;
  score: number;
  savedAt: number;
}

interface ProjectTopicData {
  files: SavedFile[];
  chats: SavedChat[];
  quizzes: SavedQuizAttempt[];
}

interface Project {
  id: string;
  name: string;
  createdAt: number;
  topics: Record<string, ProjectTopicData>;
}

interface ProjectRow {
  id: string;
  user_id: number;
  name: string;
  created_at: number;
  topics: string;
}

function emptyTopicData(): ProjectTopicData {
  return { files: [], chats: [], quizzes: [] };
}

function rowToProject(row: ProjectRow): Project {
  return { id: row.id, name: row.name, createdAt: row.created_at, topics: JSON.parse(row.topics) };
}

function getOwnedProject(userId: number, projectId: string): ProjectRow | undefined {
  return db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(projectId, userId) as ProjectRow | undefined;
}

function saveTopics(projectId: string, topics: Record<string, ProjectTopicData>) {
  db.prepare("UPDATE projects SET topics = ? WHERE id = ?").run(JSON.stringify(topics), projectId);
}

projectsRouter.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at ASC")
    .all(req.session!.userId) as ProjectRow[];
  res.json({ projects: rows.map(rowToProject) });
});

projectsRouter.post("/", (req, res) => {
  const { name } = req.body as { name?: string };
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Project name is required" });
    return;
  }
  const project: Project = { id: randomUUID(), name: name.trim(), createdAt: Date.now(), topics: {} };
  db.prepare("INSERT INTO projects (id, user_id, name, created_at, topics) VALUES (?, ?, ?, ?, ?)").run(
    project.id,
    req.session!.userId,
    project.name,
    project.createdAt,
    JSON.stringify(project.topics)
  );
  res.status(201).json({ project });
});

projectsRouter.delete("/:id", (req, res) => {
  const row = getOwnedProject(req.session!.userId, req.params.id);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  db.prepare("DELETE FROM projects WHERE id = ?").run(row.id);
  res.status(204).end();
});

projectsRouter.post("/:id/files", (req, res) => {
  const row = getOwnedProject(req.session!.userId, req.params.id);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { topic, files } = req.body as {
    topic?: string;
    files?: Array<{ mimeType: string; data: string; name?: string }>;
  };
  if (typeof topic !== "string" || !Array.isArray(files)) {
    res.status(400).json({ error: "topic and files are required" });
    return;
  }
  const project = rowToProject(row);
  const topicData = project.topics[topic] ?? emptyTopicData();
  const newFiles: SavedFile[] = files.map((f) => ({ ...f, id: randomUUID(), savedAt: Date.now() }));
  project.topics[topic] = { ...topicData, files: [...topicData.files, ...newFiles] };
  saveTopics(project.id, project.topics);
  res.json({ project });
});

projectsRouter.delete("/:id/files/:fileId", (req, res) => {
  const row = getOwnedProject(req.session!.userId, req.params.id);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const topic = req.query.topic as string | undefined;
  if (!topic) {
    res.status(400).json({ error: "topic query param is required" });
    return;
  }
  const project = rowToProject(row);
  const topicData = project.topics[topic] ?? emptyTopicData();
  topicData.files = topicData.files.filter((f) => f.id !== req.params.fileId);
  project.topics[topic] = topicData;
  saveTopics(project.id, project.topics);
  res.json({ project });
});

projectsRouter.post("/:id/chats", (req, res) => {
  const row = getOwnedProject(req.session!.userId, req.params.id);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { topic, messages } = req.body as { topic?: string; messages?: SavedChat["messages"] };
  if (typeof topic !== "string" || !Array.isArray(messages)) {
    res.status(400).json({ error: "topic and messages are required" });
    return;
  }
  const project = rowToProject(row);
  const topicData = project.topics[topic] ?? emptyTopicData();
  const chat: SavedChat = { id: randomUUID(), messages, savedAt: Date.now() };
  project.topics[topic] = { ...topicData, chats: [chat, ...topicData.chats] };
  saveTopics(project.id, project.topics);
  res.json({ project });
});

projectsRouter.delete("/:id/chats/:chatId", (req, res) => {
  const row = getOwnedProject(req.session!.userId, req.params.id);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const topic = req.query.topic as string | undefined;
  if (!topic) {
    res.status(400).json({ error: "topic query param is required" });
    return;
  }
  const project = rowToProject(row);
  const topicData = project.topics[topic] ?? emptyTopicData();
  topicData.chats = topicData.chats.filter((c) => c.id !== req.params.chatId);
  project.topics[topic] = topicData;
  saveTopics(project.id, project.topics);
  res.json({ project });
});

projectsRouter.post("/:id/quizzes", (req, res) => {
  const row = getOwnedProject(req.session!.userId, req.params.id);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { topic, difficulty, questions, answers, score } = req.body as {
    topic?: string;
    difficulty?: string;
    questions?: unknown[];
    answers?: Record<number, number>;
    score?: number;
  };
  if (typeof topic !== "string" || !Array.isArray(questions) || typeof score !== "number") {
    res.status(400).json({ error: "topic, questions, and score are required" });
    return;
  }
  const project = rowToProject(row);
  const topicData = project.topics[topic] ?? emptyTopicData();
  const attempt: SavedQuizAttempt = {
    id: randomUUID(),
    difficulty: difficulty ?? "intermediate",
    questions,
    answers: answers ?? {},
    score,
    savedAt: Date.now(),
  };
  project.topics[topic] = { ...topicData, quizzes: [attempt, ...topicData.quizzes] };
  saveTopics(project.id, project.topics);
  res.json({ project });
});

projectsRouter.delete("/:id/quizzes/:quizId", (req, res) => {
  const row = getOwnedProject(req.session!.userId, req.params.id);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const topic = req.query.topic as string | undefined;
  if (!topic) {
    res.status(400).json({ error: "topic query param is required" });
    return;
  }
  const project = rowToProject(row);
  const topicData = project.topics[topic] ?? emptyTopicData();
  topicData.quizzes = topicData.quizzes.filter((q) => q.id !== req.params.quizId);
  project.topics[topic] = topicData;
  saveTopics(project.id, project.topics);
  res.json({ project });
});
