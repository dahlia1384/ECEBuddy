import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../api";
import { sendChat } from "../api";

interface Props {
  topic: string;
}

export default function ChatWindow({ topic }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await sendChat(nextMessages, topic);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-[420px] flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="m-auto text-center text-sm text-slate-400 dark:text-slate-500">
            Ask a question about {topic.toLowerCase()} to get started.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end rounded-br-sm bg-indigo-600 text-white"
                : "self-start rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a concept, problem, or derivation…"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
