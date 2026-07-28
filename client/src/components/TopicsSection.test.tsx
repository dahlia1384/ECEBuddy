import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TopicsSection from "./TopicsSection";
import { TOPIC_INFO } from "../topicInfo";

describe("TopicsSection", () => {
  it("renders a card for every topic", () => {
    render(<TopicsSection selected="Circuit Analysis" onSelect={vi.fn()} />);
    for (const info of TOPIC_INFO) {
      expect(screen.getByText(info.title)).toBeInTheDocument();
      expect(screen.getByText(info.description)).toBeInTheDocument();
    }
  });

  it("calls onSelect with the topic title when a card is clicked", async () => {
    const onSelect = vi.fn();
    render(<TopicsSection selected="Circuit Analysis" onSelect={onSelect} />);

    await userEvent.click(screen.getByText("Signals & Systems"));

    expect(onSelect).toHaveBeenCalledWith("Signals & Systems");
  });

  it("visually marks the selected topic as active", () => {
    render(<TopicsSection selected="Digital Logic Design" onSelect={vi.fn()} />);

    const activeButton = screen.getByText("Digital Logic Design").closest("button");
    const inactiveButton = screen.getByText("Circuit Analysis").closest("button");

    expect(activeButton?.className).toContain("border-indigo-300");
    expect(inactiveButton?.className).not.toContain("border-indigo-300");
  });
});
