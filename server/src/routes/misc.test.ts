import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../test/helpers.js";
import { ECE_TOPICS } from "../topics.js";

describe("public endpoints", () => {
  let app: Express;
  let cleanup: () => void;

  beforeAll(async () => {
    ({ app, cleanup } = await createTestApp());
  });

  afterAll(() => cleanup());

  it("GET /api/health returns ok without a session", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/topics returns the full ECE topic whitelist without a session", async () => {
    const res = await request(app).get("/api/topics");
    expect(res.status).toBe(200);
    expect(res.body.topics).toEqual(ECE_TOPICS);
    expect(res.body.topics).toHaveLength(10);
  });
});
