# ECEBuddy

An AI study assistant for undergraduate Electrical & Computer Engineering coursework.
ECEBuddy answers concept questions across circuits, signals & systems, digital logic,
electromagnetics, semiconductor devices, computer architecture, control systems,
probability, embedded systems, and communication systems — and can generate practice
quizzes on any of those topics. Students can attach photos of their work or PDFs to a
chat message, and the site includes a per-subject key-equations reference (KaTeX).
Signed-in students can also save chats, quiz results, and files into named
projects/courses, organized by topic.

Built with a Node/TypeScript + Express backend, a React + Vite frontend, SQLite for
accounts/project storage, and Google's Gemini API (free tier) as the tutoring agent.
An account is required to use the app.

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
   then set up your environment:

   ```bash
   cp server/.env.example server/.env
   # edit server/.env: set GEMINI_API_KEY, and set JWT_SECRET to a long random string
   ```

   `JWT_SECRET` signs login sessions. If left unset, a random one is generated per
   process start, which invalidates all sessions on every server restart.

3. Run both the server and client in dev mode:

   ```bash
   npm run dev
   ```

   The client runs on http://localhost:5173 (proxying `/api` to the server on port 3001).

## API

Public:
- `GET /api/topics` — list of supported ECE topics
- `POST /api/auth/signup` / `POST /api/auth/login` — `{ username, password }` → sets an
  httpOnly session cookie
- `POST /api/auth/logout`, `GET /api/auth/me`

Require a signed-in session (cookie-based):
- `POST /api/chat` — `{ messages: {role, content, attachments?}[], topic?: string }` → `{ reply: string }`.
  Attachments are `{ mimeType, data (base64), name? }`, up to 4 per message, 8MB each
  (`image/png`, `image/jpeg`, `image/webp`, `image/heic`, `image/heif`, `application/pdf`).
- `POST /api/quiz` — `{ topic: string, difficulty?: "intro"|"intermediate"|"advanced", count?: number }` → `{ questions: QuizQuestion[] }`
- `/api/projects` — CRUD for projects and the files/chats/quizzes saved under them,
  scoped to the signed-in user and stored in `server/data/ecebuddy.db` (SQLite).

## Testing

```bash
npm test
```

Runs both workspaces' Vitest suites (`server` then `client`) — 132 tests total.

- **Server** (73 tests, `server/src/**/*.test.ts`) — Supertest against a real `Express`
  app (`createApp()` from `server/src/app.ts`) with an isolated temp-file SQLite
  database per test file (no shared state, no network calls). The Gemini client
  (`@google/genai`) is mocked, so tests never hit the real API. Covers password
  hashing, the full signup/login/logout/me flow, request validation on `/api/chat`
  and `/api/quiz` (attachments, topics, difficulty/count clamping), `/api/projects`
  CRUD + per-user ownership isolation, the public `/api/health` and `/api/topics`
  endpoints, and the SQLite schema itself (unique usernames, cascading deletes).
- **Client** (59 tests, `client/src/**/*.test.{ts,tsx}`) — Vitest + jsdom +
  Testing Library. Covers the `fetch`-based API layers (`api.ts`, `storage.ts`),
  attachment validation/encoding (`fileUtils.ts`), auth state management
  (`AuthContext.tsx`), and component behavior (`LoginPage`, `ChatWindow`,
  `QuizPanel`, `AttachmentChip`, `TopicSelector`) — sending messages, scoring
  quizzes, answer locking, and error states, all with the network mocked.

## Notes

ECEBuddy is a study aid, not an exam-answer service — the tutoring prompt is written to
explain concepts and point out reasoning errors rather than hand over answers to live,
graded assessments.
