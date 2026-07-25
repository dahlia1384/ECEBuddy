import { useState } from "react";
import type { QuizQuestion } from "../api";
import { fetchQuiz } from "../api";

interface Props {
  topic: string;
}

type Difficulty = "intro" | "intermediate" | "advanced";

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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Generating…" : `Generate ${topic} quiz`}
        </button>
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
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {qi + 1}. {q.question}
              </p>
              <div className="flex flex-col gap-2">
                {q.choices.map((choice, ci) => {
                  const isCorrect = ci === q.correctIndex;
                  const isPicked = ci === picked;
                  let cls =
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed ";
                  if (answered && isCorrect) {
                    cls +=
                      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                  } else if (answered && isPicked) {
                    cls +=
                      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
                  } else if (answered) {
                    cls +=
                      "border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500";
                  } else {
                    cls +=
                      "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30";
                  }
                  return (
                    <button
                      key={ci}
                      className={cls}
                      onClick={() => selectAnswer(qi, ci)}
                      disabled={answered}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
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
