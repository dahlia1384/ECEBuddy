import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { sendChat, type ChatMessage } from "../api";
import type { SavedFile } from "../storage";

interface Props {
  topic: string;
  files: SavedFile[];
}

export default function ProjectTopicChat({ topic, files }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const isFirstMessage = messages.length === 0;
    const attachments =
      isFirstMessage && files.length > 0
        ? files.map((f) => ({ mimeType: f.mimeType, data: f.data, name: f.name }))
        : undefined;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text, ...(attachments && { attachments }) },
    ];
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
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        {files.length > 0
          ? `Ask about the ${files.length} saved file${files.length === 1 ? "" : "s"} in this topic`
          : "Ask a question about this topic"}
      </p>

      {messages.length > 0 && (
        <div className="mb-2 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {messages.map((m, i) => (
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
          {loading && <div className="self-start text-xs text-slate-400">Thinking…</div>}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={files.length > 0 ? "Ask a question about these files…" : "Ask a question…"}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
