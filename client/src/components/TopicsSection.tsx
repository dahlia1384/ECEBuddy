import { TOPIC_INFO } from "../topicInfo";

interface Props {
  selected: string;
  onSelect: (topic: string) => void;
}

const ACCENTS = [
  "from-indigo-500 to-violet-500",
  "from-fuchsia-500 to-pink-500",
  "from-sky-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-red-500",
  "from-purple-500 to-indigo-500",
  "from-teal-500 to-emerald-500",
  "from-orange-500 to-amber-500",
  "from-cyan-500 to-sky-500",
];

export default function TopicsSection({ selected, onSelect }: Props) {
  return (
    <section className="space-y-4">
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-lg font-semibold tracking-tight">What ECEBuddy covers</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Pick a subject below to jump straight into it, or use the selector above.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TOPIC_INFO.map((info, i) => {
          const isActive = info.title === selected;
          return (
            <button
              key={info.title}
              onClick={() => onSelect(info.title)}
              className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? "border-indigo-300 bg-indigo-50/70 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/30"
                  : "border-slate-200 bg-white/70 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-indigo-800"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${ACCENTS[i % ACCENTS.length]}`}
              >
                <info.Icon className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {info.title}
                </p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {info.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
