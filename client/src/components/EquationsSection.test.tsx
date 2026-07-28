import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EquationsSection from "./EquationsSection";

describe("EquationsSection", () => {
  it("renders every subject as a heading", () => {
    render(<EquationsSection />);
    expect(screen.getByText("Circuit Analysis")).toBeInTheDocument();
    expect(screen.getByText("Signals & Systems")).toBeInTheDocument();
    expect(screen.getByText("Communication Systems")).toBeInTheDocument();
  });

  it("expands the first subject by default", () => {
    render(<EquationsSection />);
    expect(screen.getByText("Ohm's law")).toBeInTheDocument();
    expect(screen.getByText("Kirchhoff's current law")).toBeInTheDocument();
  });

  it("keeps other subjects collapsed by default", () => {
    render(<EquationsSection />);
    expect(screen.queryByText("Convolution")).not.toBeInTheDocument();
  });

  it("expands a subject on click", async () => {
    render(<EquationsSection />);

    await userEvent.click(screen.getByText("Signals & Systems"));

    expect(screen.getByText("Convolution")).toBeInTheDocument();
  });

  it("collapses an expanded subject on a second click", async () => {
    render(<EquationsSection />);
    expect(screen.getByText("Ohm's law")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Circuit Analysis"));

    expect(screen.queryByText("Ohm's law")).not.toBeInTheDocument();
  });

  it("allows more than one subject open at a time", async () => {
    render(<EquationsSection />);

    await userEvent.click(screen.getByText("Signals & Systems"));

    expect(screen.getByText("Ohm's law")).toBeInTheDocument();
    expect(screen.getByText("Convolution")).toBeInTheDocument();
  });
});
