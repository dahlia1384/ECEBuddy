import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, "..", "..", "client", "dist");

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

  // Serve the built client (present in the production Docker image; absent in
  // local dev, where Vite's own dev server handles the frontend instead).
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  return app;
}
