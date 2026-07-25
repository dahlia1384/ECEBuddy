import { useEffect, useState } from "react";
import { fetchTopics } from "./api";
import TopicSelector from "./components/TopicSelector";
import ChatWindow from "./components/ChatWindow";
import QuizPanel from "./components/QuizPanel";

type Mode = "chat" | "quiz";

export default function App() {
  const [topics, setTopics] = useState<string[]>([]);
  const [topic, setTopic] = useState<string>("");
  const [mode, setMode] = useState<Mode>("chat");

  useEffect(() => {
    fetchTopics()
      .then((t) => {
        setTopics(t);
        setTopic(t[0] ?? "");
      })
      .catch(() => setTopics([]));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              EB
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">ECEBuddy</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your AI study partner for Electrical &amp; Computer Engineering coursework
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {topics.length > 0 && (
            <TopicSelector topics={topics} selected={topic} onSelect={setTopic} />
          )}

          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setMode("chat")}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                mode === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Ask a question
            </button>
            <button
              onClick={() => setMode("quiz")}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                mode === "quiz"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Practice quiz
            </button>
          </div>
        </div>

        <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          {topic && mode === "chat" && <ChatWindow topic={topic} />}
          {topic && mode === "quiz" && <QuizPanel topic={topic} />}
        </main>
      </div>
    </div>
  );
}
