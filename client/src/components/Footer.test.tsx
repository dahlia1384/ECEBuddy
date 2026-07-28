import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders a mailto link to the contact address", () => {
    render(<Footer />);
    const link = screen.getByText("contact@ecebuddy.dev");
    expect(link).toHaveAttribute("href", "mailto:contact@ecebuddy.dev");
  });

  it("renders a link to the GitHub repo that opens in a new tab", () => {
    render(<Footer />);
    const link = screen.getByText("GitHub");
    expect(link).toHaveAttribute("href", "https://github.com/dahlia1384/ECEBuddy");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
