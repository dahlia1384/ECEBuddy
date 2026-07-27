import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AttachmentChip from "./AttachmentChip";

describe("AttachmentChip", () => {
  it("renders the given name when provided", () => {
    render(<AttachmentChip name="notes.png" mimeType="image/png" />);
    expect(screen.getByText("notes.png")).toBeInTheDocument();
  });

  it("falls back to a mime-based label when no name is given", () => {
    render(<AttachmentChip mimeType="application/pdf" />);
    expect(screen.getAllByText("PDF")).toHaveLength(2); // icon badge + label fallback
  });

  it("labels an image without a preview as 'Image'", () => {
    render(<AttachmentChip mimeType="image/webp" />);
    expect(screen.getAllByText("Image").length).toBeGreaterThan(0);
  });

  it("labels an unrecognized mime type as 'File'", () => {
    render(<AttachmentChip mimeType="application/octet-stream" />);
    expect(screen.getAllByText("File").length).toBeGreaterThan(0);
  });

  it("renders an image preview when previewUrl is given", () => {
    render(<AttachmentChip name="photo.png" mimeType="image/png" previewUrl="data:image/png;base64,abc" />);
    const img = screen.getByRole("img", { name: "photo.png" });
    expect(img).toHaveAttribute("src", "data:image/png;base64,abc");
  });

  it("does not render a remove button when onRemove is not provided", () => {
    render(<AttachmentChip name="notes.png" mimeType="image/png" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const onRemove = vi.fn();
    render(<AttachmentChip name="notes.png" mimeType="image/png" onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove notes.png" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
