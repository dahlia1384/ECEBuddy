import rateLimit from "express-rate-limit";

// Vitest sets NODE_ENV=test; default to an effectively-unlimited ceiling there
// so existing test suites (which sign up many users per file) aren't affected.
// Individual tests that want to exercise the real limiting behavior can still
// override SIGNUP_RATE_LIMIT_MAX explicitly before the app is created.
const isTestEnv = process.env.NODE_ENV === "test";

const windowMs = Number(process.env.SIGNUP_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000; // 1 hour
const max = Number(process.env.SIGNUP_RATE_LIMIT_MAX) || (isTestEnv ? 1_000_000 : 5);

export const signupLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many accounts created from this IP. Please try again later." });
  },
});
