# ECEBuddy

An AI study assistant for undergraduate Electrical & Computer Engineering coursework.
ECEBuddy answers concept questions across circuits, signals & systems, digital logic,
electromagnetics, semiconductor devices, computer architecture, control systems,
probability, embedded systems, and communication systems — and can generate practice
quizzes on any of those topics. Students can attach photos of their work or PDFs to a
chat message, and the site includes a per-subject key-equations reference (KaTeX).

Built with a Node/TypeScript + Express backend, a React + Vite frontend, and Google's
Gemini API (free tier) as the tutoring agent.

## Structure

```
ECEBuddy/
  server/   Express API, Gemini agent logic, /api/chat and /api/quiz
  client/   React chat + quiz UI
```

## Setup

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey),
   then add it:

   ```bash
   cp server/.env.example server/.env
   # then edit server/.env and set GEMINI_API_KEY
   ```

3. Run both the server and client in dev mode:

   ```bash
   npm run dev
   ```

   The client runs on http://localhost:5173 (proxying `/api` to the server on port 3001).

## API

- `GET /api/topics` — list of supported ECE topics
- `POST /api/chat` — `{ messages: {role, content, attachments?}[], topic?: string }` → `{ reply: string }`.
  Attachments are `{ mimeType, data (base64), name? }`, up to 4 per message, 8MB each
  (`image/png`, `image/jpeg`, `image/webp`, `image/heic`, `image/heif`, `application/pdf`).
- `POST /api/quiz` — `{ topic: string, difficulty?: "intro"|"intermediate"|"advanced", count?: number }` → `{ questions: QuizQuestion[] }`

## Notes

ECEBuddy is a study aid, not an exam-answer service — the tutoring prompt is written to
explain concepts and point out reasoning errors rather than hand over answers to live,
graded assessments.
