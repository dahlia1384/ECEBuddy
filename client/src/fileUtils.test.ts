import { describe, it, expect } from "vitest";
import { fileToAttachment, MAX_ATTACHMENTS, MAX_FILE_BYTES } from "./fileUtils";

function makeFile(content: string, name: string, type: string): File {
  return new File([content], name, { type });
}

describe("fileToAttachment", () => {
  it("rejects an unsupported mime type", async () => {
    const file = makeFile("hello", "notes.txt", "text/plain");
    await expect(fileToAttachment(file)).rejects.toThrow(/unsupported file type/);
  });

  it("rejects a file over the size limit", async () => {
    const oversized = new File([new Uint8Array(MAX_FILE_BYTES + 1)], "big.png", { type: "image/png" });
    await expect(fileToAttachment(oversized)).rejects.toThrow(/too large/);
  });

  it("accepts a file exactly at the size limit", async () => {
    const exact = new File([new Uint8Array(MAX_FILE_BYTES)], "exact.png", { type: "image/png" });
    await expect(fileToAttachment(exact)).resolves.toBeTruthy();
  });

  it("returns base64 data and a preview URL for images", async () => {
    const file = makeFile("fake-png-bytes", "photo.png", "image/png");
    const result = await fileToAttachment(file);

    expect(result.mimeType).toBe("image/png");
    expect(result.name).toBe("photo.png");
    expect(result.previewUrl).toMatch(/^data:image\/png;base64,/);
    expect(atob(result.data)).toBe("fake-png-bytes");
  });

  it("does not set a preview URL for non-image files", async () => {
    const file = makeFile("%PDF-1.4 fake", "assignment.pdf", "application/pdf");
    const result = await fileToAttachment(file);

    expect(result.mimeType).toBe("application/pdf");
    expect(result.previewUrl).toBeUndefined();
    expect(atob(result.data)).toBe("%PDF-1.4 fake");
  });

  it("gives each attachment a unique id", async () => {
    const a = await fileToAttachment(makeFile("x", "a.png", "image/png"));
    const b = await fileToAttachment(makeFile("x", "a.png", "image/png"));
    expect(a.id).not.toBe(b.id);
  });
});

describe("MAX_ATTACHMENTS", () => {
  it("is a small, sane limit", () => {
    expect(MAX_ATTACHMENTS).toBeGreaterThan(0);
    expect(MAX_ATTACHMENTS).toBeLessThanOrEqual(10);
  });
});
