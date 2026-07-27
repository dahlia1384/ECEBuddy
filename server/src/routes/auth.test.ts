import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp, uniqueUsername } from "../test/helpers.js";

describe("auth routes", () => {
  let app: Express;
  let cleanup: () => void;

  beforeAll(async () => {
    ({ app, cleanup } = await createTestApp());
  });

  afterAll(() => cleanup());

  it("signs up a new user and sets a session cookie", async () => {
    const username = uniqueUsername();
    const res = await request(app).post("/api/auth/signup").send({ username, password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ username });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/ecebuddy_session=/);
  });

  it("rejects a username that's too short", async () => {
    const res = await request(app).post("/api/auth/signup").send({ username: "ab", password: "password123" });
    expect(res.status).toBe(400);
  });

  it("rejects a password under 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ username: uniqueUsername(), password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate username", async () => {
    const username = uniqueUsername();
    await request(app).post("/api/auth/signup").send({ username, password: "password123" });
    const res = await request(app).post("/api/auth/signup").send({ username, password: "password123" });
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials and rejects incorrect ones", async () => {
    const username = uniqueUsername();
    await request(app).post("/api/auth/signup").send({ username, password: "password123" });

    const wrongLogin = await request(app).post("/api/auth/login").send({ username, password: "wrong" });
    expect(wrongLogin.status).toBe(401);

    const goodLogin = await request(app).post("/api/auth/login").send({ username, password: "password123" });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.user).toEqual({ username });
  });

  it("returns 401 for /me without a session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for /me with a valid session", async () => {
    const username = uniqueUsername();
    const agent = request.agent(app);
    await agent.post("/api/auth/signup").send({ username, password: "password123" });

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ username });
  });

  it("logs out and invalidates the session", async () => {
    const username = uniqueUsername();
    const agent = request.agent(app);
    await agent.post("/api/auth/signup").send({ username, password: "password123" });

    await agent.post("/api/auth/logout").expect(200);

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
