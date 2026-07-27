import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TopicSelector from "./TopicSelector";

const TOPICS = ["Circuit Analysis", "Signals & Systems", "Digital Logic Design"];

describe("TopicSelector", () => {
  it("renders every topic as an option", () => {
    render(<TopicSelector topics={TOPICS} selected="Circuit Analysis" onSelect={() => {}} />);
    for (const topic of TOPICS) {
      expect(screen.getByRole("option", { name: topic })).toBeInTheDocument();
    }
  });

  it("reflects the selected prop", () => {
    render(<TopicSelector topics={TOPICS} selected="Signals & Systems" onSelect={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("Signals & Systems");
  });

  it("calls onSelect with the new topic when changed", async () => {
    const onSelect = vi.fn();
    render(<TopicSelector topics={TOPICS} selected="Circuit Analysis" onSelect={onSelect} />);

    await userEvent.selectOptions(screen.getByRole("combobox"), "Digital Logic Design");

    expect(onSelect).toHaveBeenCalledWith("Digital Logic Design");
  });
});
