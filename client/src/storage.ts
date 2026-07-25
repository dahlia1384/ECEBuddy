import type { Attachment, ChatMessage, QuizQuestion } from "./api";

export interface SavedFile extends Attachment {
  id: string;
  savedAt: number;
}

export interface SavedChat {
  id: string;
  messages: ChatMessage[];
  savedAt: number;
}

export interface SavedQuizAttempt {
  id: string;
  difficulty: "intro" | "intermediate" | "advanced";
  questions: QuizQuestion[];
  answers: Record<number, number>;
  score: number;
  savedAt: number;
}

export interface ProjectTopicData {
  files: SavedFile[];
  chats: SavedChat[];
  quizzes: SavedQuizAttempt[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  topics: Record<string, ProjectTopicData>;
}

const STORAGE_KEY = "ecebuddy.projects.v1";
const CHANGE_EVENT = "ecebuddy:projects-changed";

export function onProjectsChanged(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

function notifyChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function emptyTopicData(): ProjectTopicData {
  return { files: [], chats: [], quizzes: [] };
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  notifyChanged();
}

function updateProject(id: string, updater: (p: Project) => Project) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = updater(projects[idx]);
  saveProjects(next);
}

function getTopicData(project: Project, topic: string): ProjectTopicData {
  return project.topics[topic] ?? emptyTopicData();
}

export function createProject(name: string): Project {
  const projects = loadProjects();
  const project: Project = { id: makeId(), name, createdAt: Date.now(), topics: {} };
  saveProjects([...projects, project]);
  return project;
}

export function renameProject(id: string, name: string) {
  updateProject(id, (p) => ({ ...p, name }));
}

export function deleteProject(id: string) {
  saveProjects(loadProjects().filter((p) => p.id !== id));
}

export function addFilesToProject(
  projectId: string,
  topic: string,
  files: Array<Omit<SavedFile, "id" | "savedAt">>
) {
  updateProject(projectId, (p) => {
    const topicData = getTopicData(p, topic);
    const newFiles: SavedFile[] = files.map((f) => ({ ...f, id: makeId(), savedAt: Date.now() }));
    return { ...p, topics: { ...p.topics, [topic]: { ...topicData, files: [...topicData.files, ...newFiles] } } };
  });
}

export function removeFileFromProject(projectId: string, topic: string, fileId: string) {
  updateProject(projectId, (p) => {
    const topicData = getTopicData(p, topic);
    return {
      ...p,
      topics: { ...p.topics, [topic]: { ...topicData, files: topicData.files.filter((f) => f.id !== fileId) } },
    };
  });
}

export function addChatToProject(projectId: string, topic: string, messages: ChatMessage[]) {
  updateProject(projectId, (p) => {
    const topicData = getTopicData(p, topic);
    const chat: SavedChat = { id: makeId(), messages, savedAt: Date.now() };
    return { ...p, topics: { ...p.topics, [topic]: { ...topicData, chats: [chat, ...topicData.chats] } } };
  });
}

export function removeChatFromProject(projectId: string, topic: string, chatId: string) {
  updateProject(projectId, (p) => {
    const topicData = getTopicData(p, topic);
    return {
      ...p,
      topics: { ...p.topics, [topic]: { ...topicData, chats: topicData.chats.filter((c) => c.id !== chatId) } },
    };
  });
}

export function addQuizToProject(
  projectId: string,
  topic: string,
  attempt: Omit<SavedQuizAttempt, "id" | "savedAt">
) {
  updateProject(projectId, (p) => {
    const topicData = getTopicData(p, topic);
    const saved: SavedQuizAttempt = { ...attempt, id: makeId(), savedAt: Date.now() };
    return { ...p, topics: { ...p.topics, [topic]: { ...topicData, quizzes: [saved, ...topicData.quizzes] } } };
  });
}

export function removeQuizFromProject(projectId: string, topic: string, quizId: string) {
  updateProject(projectId, (p) => {
    const topicData = getTopicData(p, topic);
    return {
      ...p,
      topics: { ...p.topics, [topic]: { ...topicData, quizzes: topicData.quizzes.filter((q) => q.id !== quizId) } },
    };
  });
}
