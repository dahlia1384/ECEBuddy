import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp, uniqueUsername } from "../test/helpers.js";

describe("/api/projects", () => {
  let app: Express;
  let cleanup: () => void;
  let alice: ReturnType<typeof request.agent>;
  let bob: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    ({ app, cleanup } = await createTestApp());
    alice = request.agent(app);
    bob = request.agent(app);
    await alice.post("/api/auth/signup").send({ username: uniqueUsername("alice"), password: "password123" });
    await bob.post("/api/auth/signup").send({ username: uniqueUsername("bob"), password: "password123" });
  });

  afterAll(() => cleanup());

  it("rejects all project routes without a session", async () => {
    expect((await request(app).get("/api/projects")).status).toBe(401);
    expect((await request(app).post("/api/projects").send({ name: "x" })).status).toBe(401);
  });

  it("creates a project and lists it back for the owner", async () => {
    const create = await alice.post("/api/projects").send({ name: "ECE 210" });
    expect(create.status).toBe(201);
    expect(create.body.project.name).toBe("ECE 210");
    expect(create.body.project.topics).toEqual({});

    const list = await alice.get("/api/projects");
    expect(list.status).toBe(200);
    expect(list.body.projects.some((p: { id: string }) => p.id === create.body.project.id)).toBe(true);
  });

  it("rejects creating a project without a name", async () => {
    const res = await alice.post("/api/projects").send({});
    expect(res.status).toBe(400);
  });

  it("does not let one user see another user's projects", async () => {
    const created = await alice.post("/api/projects").send({ name: "Alice-only project" });
    const bobList = await bob.get("/api/projects");
    expect(bobList.body.projects.some((p: { id: string }) => p.id === created.body.project.id)).toBe(false);
  });

  it("404s when a different user tries to delete or modify a project", async () => {
    const created = await alice.post("/api/projects").send({ name: "Alice's private project" });
    const projectId = created.body.project.id;

    const bobDelete = await bob.delete(`/api/projects/${projectId}`);
    expect(bobDelete.status).toBe(404);

    const bobAddFile = await bob
      .post(`/api/projects/${projectId}/files`)
      .send({ topic: "Circuit Analysis", files: [{ mimeType: "image/png", data: "abc" }] });
    expect(bobAddFile.status).toBe(404);
  });

  it("adds and removes a file under a topic", async () => {
    const created = await alice.post("/api/projects").send({ name: "Files test" });
    const projectId = created.body.project.id;

    const addRes = await alice
      .post(`/api/projects/${projectId}/files`)
      .send({ topic: "Circuit Analysis", files: [{ mimeType: "image/png", data: "abc", name: "note.png" }] });
    expect(addRes.status).toBe(200);
    const files = addRes.body.project.topics["Circuit Analysis"].files;
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("note.png");

    const fileId = files[0].id;
    const removeRes = await alice.delete(
      `/api/projects/${projectId}/files/${fileId}?topic=${encodeURIComponent("Circuit Analysis")}`
    );
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.project.topics["Circuit Analysis"].files).toHaveLength(0);
  });

  it("adds a chat under a topic", async () => {
    const created = await alice.post("/api/projects").send({ name: "Chats test" });
    const projectId = created.body.project.id;

    const messages = [
      { role: "user", content: "What is KCL?" },
      { role: "assistant", content: "It's the conservation of charge at a node." },
    ];
    const res = await alice.post(`/api/projects/${projectId}/chats`).send({ topic: "Circuit Analysis", messages });

    expect(res.status).toBe(200);
    const chats = res.body.project.topics["Circuit Analysis"].chats;
    expect(chats).toHaveLength(1);
    expect(chats[0].messages).toEqual(messages);
  });

  it("adds a quiz attempt and preserves the score", async () => {
    const created = await alice.post("/api/projects").send({ name: "Quizzes test" });
    const projectId = created.body.project.id;

    const res = await alice.post(`/api/projects/${projectId}/quizzes`).send({
      topic: "Circuit Analysis",
      difficulty: "advanced",
      questions: [{ question: "Q", choices: ["A", "B", "C", "D"], correctIndex: 0, explanation: "E" }],
      answers: { 0: 0 },
      score: 1,
    });

    expect(res.status).toBe(200);
    const quizzes = res.body.project.topics["Circuit Analysis"].quizzes;
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].score).toBe(1);
    expect(quizzes[0].difficulty).toBe("advanced");
  });

  it("deletes a project", async () => {
    const created = await alice.post("/api/projects").send({ name: "To delete" });
    const projectId = created.body.project.id;

    const del = await alice.delete(`/api/projects/${projectId}`);
    expect(del.status).toBe(204);

    const list = await alice.get("/api/projects");
    expect(list.body.projects.some((p: { id: string }) => p.id === projectId)).toBe(false);
  });

  it("404s for a project id that never existed", async () => {
    const res = await alice.delete("/api/projects/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });

  it("rejects a project name that is only whitespace", async () => {
    const res = await alice.post("/api/projects").send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("rejects adding files without a topic or with a non-array files field", async () => {
    const created = await alice.post("/api/projects").send({ name: "Bad file payloads" });
    const projectId = created.body.project.id;

    const noTopic = await alice.post(`/api/projects/${projectId}/files`).send({ files: [] });
    expect(noTopic.status).toBe(400);

    const badFiles = await alice
      .post(`/api/projects/${projectId}/files`)
      .send({ topic: "Circuit Analysis", files: "not-an-array" });
    expect(badFiles.status).toBe(400);
  });

  it("rejects adding a chat without messages as an array", async () => {
    const created = await alice.post("/api/projects").send({ name: "Bad chat payloads" });
    const projectId = created.body.project.id;

    const res = await alice
      .post(`/api/projects/${projectId}/chats`)
      .send({ topic: "Circuit Analysis", messages: "not-an-array" });
    expect(res.status).toBe(400);
  });

  it("rejects adding a quiz without a numeric score", async () => {
    const created = await alice.post("/api/projects").send({ name: "Bad quiz payloads" });
    const projectId = created.body.project.id;

    const res = await alice.post(`/api/projects/${projectId}/quizzes`).send({
      topic: "Circuit Analysis",
      questions: [{ question: "Q", choices: ["A", "B", "C", "D"], correctIndex: 0, explanation: "E" }],
      score: "1",
    });
    expect(res.status).toBe(400);
  });

  it("requires a topic query param to remove a file, chat, or quiz", async () => {
    const created = await alice.post("/api/projects").send({ name: "Missing topic query" });
    const projectId = created.body.project.id;

    expect((await alice.delete(`/api/projects/${projectId}/files/some-id`)).status).toBe(400);
    expect((await alice.delete(`/api/projects/${projectId}/chats/some-id`)).status).toBe(400);
    expect((await alice.delete(`/api/projects/${projectId}/quizzes/some-id`)).status).toBe(400);
  });

  it("removing a nonexistent file/chat/quiz id is a no-op, not an error", async () => {
    const created = await alice.post("/api/projects").send({ name: "Remove nonexistent" });
    const projectId = created.body.project.id;
    const topic = encodeURIComponent("Circuit Analysis");

    const res = await alice.delete(`/api/projects/${projectId}/files/does-not-exist?topic=${topic}`);
    expect(res.status).toBe(200);
    expect(res.body.project.topics["Circuit Analysis"].files).toEqual([]);
  });

  it("removes a saved chat and a saved quiz by id", async () => {
    const created = await alice.post("/api/projects").send({ name: "Remove chat and quiz" });
    const projectId = created.body.project.id;
    const topic = "Circuit Analysis";

    const chatRes = await alice
      .post(`/api/projects/${projectId}/chats`)
      .send({ topic, messages: [{ role: "user", content: "hi" }] });
    const chatId = chatRes.body.project.topics[topic].chats[0].id;

    const quizRes = await alice.post(`/api/projects/${projectId}/quizzes`).send({
      topic,
      questions: [{ question: "Q", choices: ["A", "B", "C", "D"], correctIndex: 0, explanation: "E" }],
      score: 0,
    });
    const quizId = quizRes.body.project.topics[topic].quizzes[0].id;

    const afterChatRemoved = await alice.delete(
      `/api/projects/${projectId}/chats/${chatId}?topic=${encodeURIComponent(topic)}`
    );
    expect(afterChatRemoved.body.project.topics[topic].chats).toEqual([]);

    const afterQuizRemoved = await alice.delete(
      `/api/projects/${projectId}/quizzes/${quizId}?topic=${encodeURIComponent(topic)}`
    );
    expect(afterQuizRemoved.body.project.topics[topic].quizzes).toEqual([]);
  });

  it("lists projects ordered by creation time ascending", async () => {
    const first = await alice.post("/api/projects").send({ name: "First created" });
    const second = await alice.post("/api/projects").send({ name: "Second created" });

    const list = await alice.get("/api/projects");
    const ids = list.body.projects.map((p: { id: string }) => p.id);
    expect(ids.indexOf(first.body.project.id)).toBeLessThan(ids.indexOf(second.body.project.id));
  });
});
