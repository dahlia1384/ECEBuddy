import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";
import { quizRouter } from "./routes/quiz.js";
import { ECE_TOPICS } from "./topics.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json({ limit: "40mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/topics", (_req, res) => {
  res.json({ topics: ECE_TOPICS });
});

app.use("/api/chat", chatRouter);
app.use("/api/quiz", quizRouter);

app.listen(PORT, () => {
  console.log(`ECEBuddy server listening on http://localhost:${PORT}`);
});
