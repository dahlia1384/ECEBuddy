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

const CHANGE_EVENT = "ecebuddy:projects-changed";

export function onProjectsChanged(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

function notifyChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/projects${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export async function loadProjects(): Promise<Project[]> {
  const data = await request<{ projects: Project[] }>("");
  return data.projects;
}

export async function createProject(name: string): Promise<Project> {
  const data = await request<{ project: Project }>("", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  notifyChanged();
  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  await request<void>(`/${id}`, { method: "DELETE" });
  notifyChanged();
}

export async function addFilesToProject(
  projectId: string,
  topic: string,
  files: Array<Omit<SavedFile, "id" | "savedAt">>
): Promise<void> {
  await request(`/${projectId}/files`, { method: "POST", body: JSON.stringify({ topic, files }) });
  notifyChanged();
}

export async function removeFileFromProject(projectId: string, topic: string, fileId: string): Promise<void> {
  await request(`/${projectId}/files/${fileId}?topic=${encodeURIComponent(topic)}`, { method: "DELETE" });
  notifyChanged();
}

export async function addChatToProject(projectId: string, topic: string, messages: ChatMessage[]): Promise<void> {
  await request(`/${projectId}/chats`, { method: "POST", body: JSON.stringify({ topic, messages }) });
  notifyChanged();
}

export async function removeChatFromProject(projectId: string, topic: string, chatId: string): Promise<void> {
  await request(`/${projectId}/chats/${chatId}?topic=${encodeURIComponent(topic)}`, { method: "DELETE" });
  notifyChanged();
}

export async function addQuizToProject(
  projectId: string,
  topic: string,
  attempt: Omit<SavedQuizAttempt, "id" | "savedAt">
): Promise<void> {
  await request(`/${projectId}/quizzes`, { method: "POST", body: JSON.stringify({ topic, ...attempt }) });
  notifyChanged();
}

export async function removeQuizFromProject(projectId: string, topic: string, quizId: string): Promise<void> {
  await request(`/${projectId}/quizzes/${quizId}?topic=${encodeURIComponent(topic)}`, { method: "DELETE" });
  notifyChanged();
}
