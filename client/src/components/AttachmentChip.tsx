interface Props {
  name?: string;
  mimeType: string;
  previewUrl?: string;
  onRemove?: () => void;
}

function fileLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Image";
  return "File";
}

export default function AttachmentChip({ name, mimeType, previewUrl, onRemove }: Props) {
  return (
    <div className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-xs dark:border-slate-800 dark:bg-slate-900">
      {previewUrl ? (
        <img src={previewUrl} alt={name ?? "attachment"} className="h-8 w-8 rounded object-cover" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-50 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
          {fileLabel(mimeType)}
        </div>
      )}
      <span className="max-w-[9rem] truncate text-slate-600 dark:text-slate-300">
        {name ?? fileLabel(mimeType)}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${name ?? "attachment"}`}
          className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
