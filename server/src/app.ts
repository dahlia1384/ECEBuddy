import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { chatRouter } from "./routes/chat.js";
import { quizRouter } from "./routes/quiz.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { requireAuth } from "./auth.js";
import { ECE_TOPICS } from "./topics.js";
import "./db.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "40mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/topics", (_req, res) => {
    res.json({ topics: ECE_TOPICS });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/chat", requireAuth, chatRouter);
  app.use("/api/quiz", requireAuth, quizRouter);
  app.use("/api/projects", projectsRouter);

  return app;
}
