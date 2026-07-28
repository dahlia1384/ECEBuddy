import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Equation from "./Equation";

describe("Equation", () => {
  it("renders KaTeX markup for valid LaTeX", () => {
    const { container } = render(<Equation latex="V = IR" />);
    expect(container.querySelector(".katex")).toBeInTheDocument();
    expect(container.textContent).toContain("V");
  });

  it("does not throw on invalid LaTeX (throwOnError is disabled)", () => {
    expect(() => render(<Equation latex="\\notarealcommand{" />)).not.toThrow();
  });

  it("re-renders when the latex prop changes", () => {
    const { container, rerender } = render(<Equation latex="V = IR" />);
    expect(container.textContent).toContain("V");

    rerender(<Equation latex="P = VI" />);
    expect(container.textContent).toContain("P");
  });
});
