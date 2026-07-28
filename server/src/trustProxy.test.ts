import { describe, it, expect, afterEach } from "vitest";
import { createTestApp } from "./test/helpers.js";

describe("trust proxy configuration", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("trusts the first proxy hop in production (required for rate limiting behind Render)", async () => {
    process.env.NODE_ENV = "production";
    const { app, cleanup } = await createTestApp();
    try {
      expect(app.get("trust proxy")).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("does not set trust proxy outside production", async () => {
    process.env.NODE_ENV = "test";
    const { app, cleanup } = await createTestApp();
    try {
      expect(app.get("trust proxy")).toBeFalsy();
    } finally {
      cleanup();
    }
  });
});
