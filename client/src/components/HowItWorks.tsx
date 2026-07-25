const STEPS = [
  {
    title: "Pick a subject",
    description: "Choose from ten core ECE topics, from circuits to communication systems.",
  },
  {
    title: "Ask or practice",
    description: "Chat through a concept — attach photos of your notes — or generate a quiz.",
  },
  {
    title: "Learn faster",
    description: "Get step-by-step explanations and instant feedback with worked answers.",
  },
];

export default function HowItWorks() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <div
          key={step.title}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
        >
          <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold text-white">
            {i + 1}
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {step.description}
          </p>
        </div>
      ))}
    </section>
  );
}
