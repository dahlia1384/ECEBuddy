import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp, uniqueUsername } from "../test/helpers.js";

describe("POST /api/auth/signup rate limiting", () => {
  let app: Express;
  let cleanup: () => void;

  beforeAll(async () => {
    ({ app, cleanup } = await createTestApp({
      SIGNUP_RATE_LIMIT_MAX: "3",
      SIGNUP_RATE_LIMIT_WINDOW_MS: "60000",
    }));
  });

  afterAll(() => {
    cleanup();
    // Prevent this file's low limit from leaking into other test files that
    // share the same worker process and expect the test-env default.
    delete process.env.SIGNUP_RATE_LIMIT_MAX;
    delete process.env.SIGNUP_RATE_LIMIT_WINDOW_MS;
  });

  it("allows signups up to the configured limit", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ username: uniqueUsername("ratelimit"), password: "password123" });
      expect(res.status).toBe(200);
    }
  });

  it("rejects the next signup with 429 once the limit is exceeded", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ username: uniqueUsername("ratelimit"), password: "password123" });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/Too many accounts created/);
  });

  it("does not rate-limit login, only signup", async () => {
    // The 3-request signup budget is already exhausted above; login should
    // still work normally since it isn't behind the signup limiter.
    const username = uniqueUsername("ratelimit-login");
    // Sneak one more signup in isn't possible (limit exhausted), so instead
    // verify login on a nonexistent user still returns a normal 401, not 429.
    const res = await request(app).post("/api/auth/login").send({ username, password: "whatever1" });
    expect(res.status).toBe(401);
  });
});
