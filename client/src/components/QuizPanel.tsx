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
    <div className="quiz-panel">
      <div className="quiz-controls">
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
          <option value="intro">Intro</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : `Generate ${topic} quiz`}
        </button>
      </div>
      {error && <p className="chat-error">{error}</p>}
      <div className="quiz-questions">
        {questions.map((q, qi) => {
          const picked = answers[qi];
          const answered = picked !== undefined;
          return (
            <div key={qi} className="quiz-question">
              <p className="quiz-question-text">
                {qi + 1}. {q.question}
              </p>
              <div className="quiz-choices">
                {q.choices.map((choice, ci) => {
                  let cls = "quiz-choice";
                  if (answered) {
                    if (ci === q.correctIndex) cls += " correct";
                    else if (ci === picked) cls += " incorrect";
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
              {answered && <p className="quiz-explanation">{q.explanation}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
