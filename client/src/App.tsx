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
    <div className="app">
      <header className="app-header">
        <h1>ECEBuddy</h1>
        <p>Your AI study partner for Electrical &amp; Computer Engineering coursework</p>
      </header>

      <div className="app-controls">
        {topics.length > 0 && <TopicSelector topics={topics} selected={topic} onSelect={setTopic} />}
        <div className="mode-toggle">
          <button className={mode === "chat" ? "active" : ""} onClick={() => setMode("chat")}>
            Ask a question
          </button>
          <button className={mode === "quiz" ? "active" : ""} onClick={() => setMode("quiz")}>
            Practice quiz
          </button>
        </div>
      </div>

      <main className="app-main">
        {topic && mode === "chat" && <ChatWindow topic={topic} />}
        {topic && mode === "quiz" && <QuizPanel topic={topic} />}
      </main>
    </div>
  );
}
