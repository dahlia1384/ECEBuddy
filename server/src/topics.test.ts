import { describe, it, expect } from "vitest";
import { isEceTopic, ECE_TOPICS } from "./topics.js";

describe("isEceTopic", () => {
  it("accepts every topic in the whitelist", () => {
    for (const topic of ECE_TOPICS) {
      expect(isEceTopic(topic)).toBe(true);
    }
  });

  it("rejects strings outside the whitelist", () => {
    expect(isEceTopic("Interpretive Dance")).toBe(false);
    expect(isEceTopic("")).toBe(false);
    expect(isEceTopic("circuit analysis")).toBe(false); // case-sensitive
  });
});
