# ECEBuddy

An AI study assistant for undergraduate Electrical & Computer Engineering coursework.
ECEBuddy answers concept questions across circuits, signals & systems, digital logic,
electromagnetics, semiconductor devices, computer architecture, control systems,
probability, embedded systems, and communication systems — and can generate practice
quizzes on any of those topics.

Built with a Node/TypeScript + Express backend, a React + Vite frontend, and Claude
(Anthropic API) as the tutoring agent.

## Structure

```
ECEBuddy/
  server/   Express API, Claude agent logic, /api/chat and /api/quiz
  client/   React chat + quiz UI
```

## Setup

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Add your Anthropic API key:

   ```bash
   cp server/.env.example server/.env
   # then edit server/.env and set ANTHROPIC_API_KEY
   ```

3. Run both the server and client in dev mode:

   ```bash
   npm run dev
   ```

   The client runs on http://localhost:5173 (proxying `/api` to the server on port 3001).

## API

- `GET /api/topics` — list of supported ECE topics
- `POST /api/chat` — `{ messages: {role, content}[], topic?: string }` → `{ reply: string }`
- `POST /api/quiz` — `{ topic: string, difficulty?: "intro"|"intermediate"|"advanced", count?: number }` → `{ questions: QuizQuestion[] }`

## Notes

ECEBuddy is a study aid, not an exam-answer service — the tutoring prompt is written to
explain concepts and point out reasoning errors rather than hand over answers to live,
graded assessments.
