import { Router } from "express";
import { db } from "../db.js";
import {
  hashPassword,
  verifyPassword,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  readSession,
  requireAuth,
} from "../auth.js";

export const authRouter = Router();

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
}

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

authRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    res.status(400).json({ error: "Username must be 3-32 characters (letters, numbers, _ . -)" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    res.status(409).json({ error: "That username is already taken" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const createdAt = Date.now();
  const result = db
    .prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)")
    .run(username, passwordHash, createdAt);

  const token = signSession({ userId: Number(result.lastInsertRowid), username });
  setSessionCookie(res, token);
  res.json({ user: { username } });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = signSession({ userId: user.id, username: user.username });
  setSessionCookie(res, token);
  res.json({ user: { username: user.username } });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.json({ user: { username: session.username } });
});

export { requireAuth };
