import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HowItWorks from "./HowItWorks";

describe("HowItWorks", () => {
  it("renders all three steps in order with numbered badges", () => {
    render(<HowItWorks />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Pick a subject")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Ask or practice")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Learn faster")).toBeInTheDocument();
  });
});
