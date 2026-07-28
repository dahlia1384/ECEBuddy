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

Runs both workspaces' Vitest suites (`server` then `client`) — 195 tests total.

- **Server** (78 tests, `server/src/**/*.test.ts`) — Supertest against a real `Express`
  app (`createApp()` from `server/src/app.ts`) with an isolated temp-file SQLite
  database per test file (no shared state, no network calls). The Gemini client
  (`@google/genai`) is mocked, so tests never hit the real API. Covers password
  hashing, the full signup/login/logout/me flow, request validation on `/api/chat`
  and `/api/quiz` (attachments, topics, difficulty/count clamping), `/api/projects`
  CRUD + per-user ownership isolation, the public `/api/health` and `/api/topics`
  endpoints, the SQLite schema itself (unique usernames, cascading deletes), signup
  rate limiting, and the production `trust proxy` configuration it depends on.
- **Client** (117 tests, `client/src/**/*.test.{ts,tsx}`) — Vitest + jsdom +
  Testing Library. Covers the `fetch`-based API layers (`api.ts`, `storage.ts`),
  attachment validation/encoding (`fileUtils.ts`), auth state management
  (`AuthContext.tsx`), `App.tsx`'s auth gating, and component behavior across
  `LoginPage`, `ChatWindow`, `QuizPanel`, the whole Projects feature
  (`ProjectsSection`, `ProjectCard`, `SaveToProjectButton`, `ProjectTopicChat`),
  and the informational sections (`TopicsSection`, `EquationsSection`,
  `HowItWorks`, `Footer`, `Equation`) — sending messages, scoring quizzes,
  answer locking, file uploads, and error states, all with the network mocked.

## Docker

A single multi-stage `Dockerfile` at the repo root builds the client, builds the
server, and serves both from one container (Express serves the API under `/api/*`
and the built React app for everything else).

```bash
docker build -t ecebuddy .
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your-key \
  -e JWT_SECRET=a-long-random-string \
  ecebuddy
```

Requires Node 22+ (pinned in the image) — `better-sqlite3`'s prebuilt binaries need
it, and its bundled `linux-arm64` prebuild also doesn't match Debian slim's glibc, so
the Dockerfile deletes it and compiles from source instead (see the comment above
that step).

## Deploying for free (Render)

`render.yaml` is a [Render](https://render.com) Blueprint that deploys the Dockerfile
as a free web service:

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the Render dashboard: **New +** → **Blueprint**, connect this GitHub repo.
   Render detects `render.yaml` automatically.
3. When prompted, set `GEMINI_API_KEY` (your key from Google AI Studio). `JWT_SECRET`
   is generated for you.
4. Deploy. Render gives you a free `https://<name>.onrender.com` URL.

**Two free-tier caveats worth knowing before you rely on this:**
- Free web services spin down after ~15 minutes idle and take a few seconds to wake
  back up on the next request.
- Free services have **no persistent disk** — the SQLite file (accounts, saved
  projects) resets on every redeploy and can reset on restart. Fine for a demo link;
  not durable storage. A persistent disk requires a paid Render plan.

## Notes

ECEBuddy is a study aid, not an exam-answer service — the tutoring prompt is written to
explain concepts and point out reasoning errors rather than hand over answers to live,
graded assessments.
