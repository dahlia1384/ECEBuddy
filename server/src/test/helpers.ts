import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import type { Express } from "express";

/**
 * Sets up an isolated SQLite file + JWT secret for one test file, then
 * dynamically imports createApp so db.ts picks up DB_PATH before it runs
 * its module-load-time CREATE TABLE statements. Must be awaited from
 * beforeAll before any other module in this test file touches ../app.js.
 *
 * `envOverrides` lets a specific test file opt into non-default env vars
 * (e.g. a strict SIGNUP_RATE_LIMIT_MAX) before that file's isolated module
 * graph reads them at import time.
 */
export async function createTestApp(
  envOverrides: Record<string, string> = {}
): Promise<{ app: Express; cleanup: () => void }> {
  const dbPath = path.join(os.tmpdir(), `ecebuddy-test-${randomUUID()}.db`);
  process.env.DB_PATH = dbPath;
  process.env.JWT_SECRET = "test-secret-do-not-use-in-production";
  for (const [key, value] of Object.entries(envOverrides)) {
    process.env[key] = value;
  }

  const { createApp } = await import("../app.js");
  const app = createApp();

  function cleanup() {
    for (const suffix of ["", "-wal", "-shm"]) {
      fs.rmSync(dbPath + suffix, { force: true });
    }
  }

  return { app, cleanup };
}

export function uniqueUsername(prefix = "user"): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}
