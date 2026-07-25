import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  addFilesToProject,
  removeFileFromProject,
  removeChatFromProject,
  removeQuizFromProject,
  deleteProject,
  type Project,
} from "../storage";
import { fileToAttachment } from "../fileUtils";
import AttachmentChip from "./AttachmentChip";

interface Props {
  project: Project;
  topics: string[];
  onChanged: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProjectCard({ project, topics, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [uploadTopic, setUploadTopic] = useState(topics[0] ?? "");
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTopics = Object.entries(project.topics).filter(
    ([, data]) => data.files.length > 0 || data.chats.length > 0 || data.quizzes.length > 0
  );
  const fileCount = activeTopics.reduce((sum, [, d]) => sum + d.files.length, 0);
  const chatCount = activeTopics.reduce((sum, [, d]) => sum + d.chats.length, 0);
  const quizCount = activeTopics.reduce((sum, [, d]) => sum + d.quizzes.length, 0);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !uploadTopic) return;
    setError(null);
    const results = await Promise.allSettled(Array.from(fileList).map(fileToAttachment));
    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fileToAttachment>>> => r.status === "fulfilled")
      .map(({ value }) => ({ mimeType: value.mimeType, data: value.data, name: value.name }));
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (succeeded.length > 0) {
      addFilesToProject(project.id, uploadTopic, succeeded);
      onChanged();
    }
    if (failed.length > 0) {
      setError(failed.map((f) => f.reason?.message ?? "Failed to add file").join(" "));
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{project.name}</p>
          <p className="text-xs text-slate-400">
            Created {formatDate(project.createdAt)} · {fileCount} files · {chatCount} chats · {quizCount} quizzes
          </p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={uploadTopic}
              onChange={(e) => setUploadTopic(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
              className="hidden"
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-300"
            >
              + Add files to this topic
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete project "${project.name}"? This can't be undone.`)) {
                  deleteProject(project.id);
                  onChanged();
                }
              }}
              className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Delete project
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          {activeTopics.length === 0 && (
            <p className="text-sm text-slate-400">
              Nothing saved yet. Add files above, or use "Save to project" from a chat or quiz.
            </p>
          )}

          {activeTopics.map(([topic, data]) => (
            <div key={topic} className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/40">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{topic}</p>

              {data.files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.files.map((f) => (
                    <AttachmentChip
                      key={f.id}
                      name={f.name}
                      mimeType={f.mimeType}
                      previewUrl={f.mimeType.startsWith("image/") ? `data:${f.mimeType};base64,${f.data}` : undefined}
                      onRemove={() => {
                        removeFileFromProject(project.id, topic, f.id);
                        onChanged();
                      }}
                    />
                  ))}
                </div>
              )}

              {data.chats.map((chat) => (
                <div key={chat.id} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                      className="text-left text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                    >
                      Saved chat · {formatDate(chat.savedAt)} · {chat.messages.length} messages
                    </button>
                    <button
                      onClick={() => {
                        removeChatFromProject(project.id, topic, chat.id);
                        onChanged();
                      }}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  {expandedChat === chat.id && (
                    <div className="mt-2 flex flex-col gap-2">
                      {chat.messages.map((m, i) => (
                        <div
                          key={i}
                          className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            m.role === "user"
                              ? "self-end bg-indigo-600 text-white"
                              : "self-start border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
                          }`}
                        >
                          {m.role === "assistant" ? (
                            <div className="prose prose-xs dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">{m.content}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {data.quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                      className="text-left text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                    >
                      Quiz result · {quiz.score}/{quiz.questions.length} · {quiz.difficulty} · {formatDate(quiz.savedAt)}
                    </button>
                    <button
                      onClick={() => {
                        removeQuizFromProject(project.id, topic, quiz.id);
                        onChanged();
                      }}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  {expandedQuiz === quiz.id && (
                    <div className="mt-2 flex flex-col gap-2">
                      {quiz.questions.map((q, qi) => {
                        const picked = quiz.answers[qi];
                        const correct = picked === q.correctIndex;
                        return (
                          <div key={qi} className="text-xs">
                            <p className="font-medium text-slate-700 dark:text-slate-200">
                              {qi + 1}. {q.question}
                            </p>
                            <p className={correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                              {picked !== undefined ? `Your answer: ${q.choices[picked]}` : "Not answered"}
                              {!correct && ` · Correct: ${q.choices[q.correctIndex]}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
