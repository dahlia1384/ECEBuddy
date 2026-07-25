import { useEffect, useState } from "react";
import { fetchTopics } from "./api";
import TopicSelector from "./components/TopicSelector";
import ChatWindow from "./components/ChatWindow";
import QuizPanel from "./components/QuizPanel";
import Footer from "./components/Footer";
import TopicsSection from "./components/TopicsSection";
import HowItWorks from "./components/HowItWorks";
import EquationsSection from "./components/EquationsSection";
import ProjectsSection from "./components/ProjectsSection";

type Mode = "chat" | "quiz";

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

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
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="space-y-4 text-center sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-base font-bold text-white shadow-lg shadow-indigo-500/30">
              EB
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-fuchsia-400">
                ECEBuddy
              </span>
            </h1>
          </div>
          <p className="mx-auto max-w-xl text-sm text-slate-500 sm:mx-0 sm:text-base dark:text-slate-400">
            Your AI study partner for Electrical &amp; Computer Engineering coursework —
            ask questions, attach photos of your work, and practice with generated quizzes.
          </p>
          {topics.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {topics.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-200 bg-white/60 px-2.5 py-1 text-xs text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
                >
                  {t}
                </span>
              ))}
              <span className="rounded-full border border-slate-200 bg-white/60 px-2.5 py-1 text-xs text-slate-400 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
                +{Math.max(topics.length - 6, 0)} more
              </span>
            </div>
          )}
        </header>

        <HowItWorks />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {topics.length > 0 && (
            <TopicSelector topics={topics} selected={topic} onSelect={setTopic} />
          )}

          <div className="inline-flex rounded-lg border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <button
              onClick={() => setMode("chat")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                mode === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <ChatIcon />
              Ask a question
            </button>
            <button
              onClick={() => setMode("quiz")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                mode === "quiz"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <QuizIcon />
              Practice quiz
            </button>
          </div>
        </div>

        <main className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500" />
          {topic && mode === "chat" && <ChatWindow topic={topic} />}
          {topic && mode === "quiz" && <QuizPanel topic={topic} />}
        </main>

        {topics.length > 0 && <ProjectsSection topics={topics} />}

        <TopicsSection
          selected={topic}
          onSelect={(t) => {
            setTopic(t);
            setMode("chat");
          }}
        />

        <EquationsSection />

        <Footer />
      </div>
    </div>
  );
}
