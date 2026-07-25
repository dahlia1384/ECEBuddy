import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../api";
import { sendChat } from "../api";
import { fileToAttachment, MAX_ATTACHMENTS, type PendingAttachment } from "../fileUtils";
import AttachmentChip from "./AttachmentChip";

interface Props {
  topic: string;
}

export default function ChatWindow({ topic }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const remainingSlots = MAX_ATTACHMENTS - pendingFiles.length;
    const files = Array.from(fileList).slice(0, Math.max(remainingSlots, 0));
    if (fileList.length > remainingSlots) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
    }

    const results = await Promise.allSettled(files.map(fileToAttachment));
    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<PendingAttachment> => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

    if (succeeded.length > 0) {
      setPendingFiles((prev) => [...prev, ...succeeded]);
    }
    if (failed.length > 0) {
      setError(failed.map((f) => f.reason?.message ?? "Failed to attach file").join(" "));
    }
  }

  function removePendingFile(id: string) {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSend() {
    const text = input.trim();
    if ((!text && pendingFiles.length === 0) || loading) return;

    const attachments = pendingFiles.map(({ id: _id, previewUrl: _previewUrl, ...rest }) => rest);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text, ...(attachments.length > 0 && { attachments }) },
    ];
    setMessages(nextMessages);
    setInput("");
    setPendingFiles([]);
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
            Ask a question about {topic.toLowerCase()} to get started — you can attach photos of your
            work or PDFs too.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end rounded-br-sm bg-indigo-600 text-white"
                : "self-start rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            }`}
          >
            {m.attachments && m.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {m.attachments.map((a, ai) =>
                  a.mimeType.startsWith("image/") ? (
                    <img
                      key={ai}
                      src={`data:${a.mimeType};base64,${a.data}`}
                      alt={a.name ?? "attachment"}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      key={ai}
                      className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs"
                    >
                      <span>{a.name ?? "document.pdf"}</span>
                    </div>
                  )
                )}
              </div>
            )}
            {m.content &&
              (m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ))}
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

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((f) => (
              <AttachmentChip
                key={f.id}
                name={f.name}
                mimeType={f.mimeType}
                previewUrl={f.previewUrl}
                onRemove={() => removePendingFile(f.id)}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
            className="hidden"
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pendingFiles.length >= MAX_ATTACHMENTS}
            title="Attach photos or files"
            aria-label="Attach photos or files"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          </button>
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
            disabled={loading || (!input.trim() && pendingFiles.length === 0)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
