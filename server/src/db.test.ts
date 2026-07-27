import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

describe("db schema", () => {
  let dbPath: string;
  let db: import("better-sqlite3").Database;

  beforeAll(async () => {
    dbPath = path.join(os.tmpdir(), `ecebuddy-test-${randomUUID()}.db`);
    process.env.DB_PATH = dbPath;
    ({ db } = await import("./db.js"));
  });

  afterAll(() => {
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbPath + suffix, { force: true });
  });

  function tableNames(): string[] {
    return (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(
      (r) => r.name
    );
  }

  it("creates the users and projects tables", () => {
    const tables = tableNames();
    expect(tables).toContain("users");
    expect(tables).toContain("projects");
  });

  it("enforces a unique username constraint", () => {
    db.prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)").run(
      "dupe-test-user",
      "hash",
      Date.now()
    );

    expect(() =>
      db
        .prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)")
        .run("dupe-test-user", "hash2", Date.now())
    ).toThrow();
  });

  it("cascades project deletion when a user is deleted", () => {
    const result = db
      .prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)")
      .run("cascade-test-user", "hash", Date.now());
    const userId = Number(result.lastInsertRowid);

    db.prepare("INSERT INTO projects (id, user_id, name, created_at, topics) VALUES (?, ?, ?, ?, ?)").run(
      "cascade-project",
      userId,
      "Cascade test",
      Date.now(),
      "{}"
    );

    db.prepare("DELETE FROM users WHERE id = ?").run(userId);

    const remaining = db.prepare("SELECT * FROM projects WHERE id = ?").get("cascade-project");
    expect(remaining).toBeUndefined();
  });
});
