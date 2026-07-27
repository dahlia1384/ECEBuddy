import { useState } from "react";
import type { QuizQuestion } from "../api";
import { fetchQuiz } from "../api";
import { addQuizToProject } from "../storage";
import SaveToProjectButton from "./SaveToProjectButton";

interface Props {
  topic: string;
}

type Difficulty = "intro" | "intermediate" | "advanced";

const CHOICE_LABELS = ["A", "B", "C", "D"];

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function QuizPanel({ topic }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setAnswers({});
    try {
      const result = await fetchQuiz(topic, difficulty, 5);
      setQuestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIndex: number, choiceIndex: number) {
    if (answers[qIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: choiceIndex }));
  }

  const answeredCount = Object.keys(answers).length;
  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
        >
          <option value="intro">Intro</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {loading ? "Generating…" : `Generate ${topic} quiz`}
        </button>
        {questions.length > 0 && (
          <SaveToProjectButton
            label="Save results"
            onSave={(project) => addQuizToProject(project.id, topic, { difficulty, questions, answers, score })}
          />
        )}
        {allAnswered && (
          <span className="ml-auto animate-fade-slide-up rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            Score: {score}/{questions.length}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      {questions.length === 0 && !loading && !error && (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500">
          Generate a quiz to start practicing {topic.toLowerCase()}.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {questions.map((q, qi) => {
          const picked = answers[qi];
          const answered = picked !== undefined;
          return (
            <div
              key={qi}
              className="animate-fade-slide-up rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-sm dark:border-slate-800"
              style={{ animationDelay: `${qi * 60}ms` }}
            >
              <p className="mb-3 flex items-start gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {qi + 1}
                </span>
                {q.question}
              </p>
              <div className="flex flex-col gap-2">
                {q.choices.map((choice, ci) => {
                  const isCorrect = ci === q.correctIndex;
                  const isPicked = ci === picked;
                  let cls =
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-all disabled:cursor-not-allowed ";
                  let badgeCls = "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ";
                  if (answered && isCorrect) {
                    cls +=
                      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                    badgeCls += "bg-emerald-500 text-white";
                  } else if (answered && isPicked) {
                    cls +=
                      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
                    badgeCls += "bg-red-500 text-white";
                  } else if (answered) {
                    cls += "border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500";
                    badgeCls += "bg-slate-100 text-slate-400 dark:bg-slate-800";
                  } else {
                    cls +=
                      "border-slate-200 bg-white hover:-translate-y-px hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30";
                    badgeCls += "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
                  }
                  return (
                    <button key={ci} className={cls} onClick={() => selectAnswer(qi, ci)} disabled={answered}>
                      <span className={badgeCls}>
                        {answered && isCorrect ? <CheckIcon /> : answered && isPicked ? <XIcon /> : CHOICE_LABELS[ci]}
                      </span>
                      {choice}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className="mt-3 animate-fade-slide-up text-sm text-slate-500 dark:text-slate-400">
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
