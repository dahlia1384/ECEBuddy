import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET =
  process.env.JWT_SECRET ??
  (() => {
    console.warn(
      "JWT_SECRET is not set — generating a random one for this process. " +
        "Sessions will be invalidated on every restart. Set JWT_SECRET in server/.env for persistent sessions."
    );
    return crypto.randomBytes(32).toString("hex");
  })();

const COOKIE_NAME = "ecebuddy_session";
const TOKEN_TTL = "30d";

export interface SessionPayload {
  userId: number;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export function readSession(req: Request): SessionPayload | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  req.session = session;
  next();
}
