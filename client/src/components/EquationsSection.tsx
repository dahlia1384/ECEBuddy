import { useState } from "react";
import { EQUATIONS_INFO } from "../equationsInfo";
import Equation from "./Equation";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function EquationsSection() {
  const [openTopics, setOpenTopics] = useState<Set<string>>(() => new Set([EQUATIONS_INFO[0].title]));

  function toggle(title: string) {
    setOpenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-lg font-semibold tracking-tight">Key equations by subject</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A quick-reference cheat sheet — tap a subject to expand its core formulas.
        </p>
      </div>

      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white/70 backdrop-blur dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/70">
        {EQUATIONS_INFO.map((topic) => {
          const open = openTopics.has(topic.title);
          return (
            <div key={topic.title}>
              <button
                onClick={() => toggle(topic.title)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {topic.title}
                </span>
                <ChevronIcon open={open} />
              </button>
              {open && (
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 pb-4 sm:grid-cols-2">
                  {topic.equations.map((eq) => (
                    <div
                      key={eq.label}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40"
                    >
                      <span className="text-xs text-slate-500 dark:text-slate-400">{eq.label}</span>
                      <Equation latex={eq.latex} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
