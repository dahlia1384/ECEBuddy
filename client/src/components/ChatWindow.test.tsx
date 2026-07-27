import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatWindow from "./ChatWindow";
import { sendChat } from "../api";

vi.mock("../api", () => ({ sendChat: vi.fn() }));
vi.mock("../storage", () => ({
  addChatToProject: vi.fn(),
  loadProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn(),
}));

const mockSendChat = vi.mocked(sendChat);

beforeAll(() => {
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ChatWindow", () => {
  beforeEach(() => {
    mockSendChat.mockReset();
    mockSendChat.mockResolvedValue("Ohm's law is V = IR.");
  });

  it("shows an empty-state prompt with the topic name before any message is sent", () => {
    render(<ChatWindow topic="Circuit Analysis" />);
    expect(screen.getByText(/Ask a question about circuit analysis to get started/)).toBeInTheDocument();
  });

  it("disables Send until there is input", () => {
    render(<ChatWindow topic="Circuit Analysis" />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("sends the typed message and renders both the user message and the reply", async () => {
    render(<ChatWindow topic="Circuit Analysis" />);

    await userEvent.type(
      screen.getByPlaceholderText("Ask about a concept, problem, or derivation…"),
      "What is Ohm's law?"
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("What is Ohm's law?")).toBeInTheDocument();
    expect(mockSendChat).toHaveBeenCalledWith(
      [{ role: "user", content: "What is Ohm's law?" }],
      "Circuit Analysis"
    );

    await waitFor(() => expect(screen.getByText("Ohm's law is V = IR.")).toBeInTheDocument());
  });

  it("clears the input box after sending", async () => {
    render(<ChatWindow topic="Circuit Analysis" />);
    const textarea = screen.getByPlaceholderText(
      "Ask about a concept, problem, or derivation…"
    ) as HTMLTextAreaElement;

    await userEvent.type(textarea, "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(textarea.value).toBe("");
  });

  it("sends on Enter but inserts a newline on Shift+Enter", async () => {
    render(<ChatWindow topic="Circuit Analysis" />);
    const textarea = screen.getByPlaceholderText("Ask about a concept, problem, or derivation…");

    await userEvent.type(textarea, "line one{Shift>}{Enter}{/Shift}line two");
    expect(mockSendChat).not.toHaveBeenCalled();

    await userEvent.type(textarea, "{Enter}");
    expect(mockSendChat).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when the request fails, but keeps the user's message", async () => {
    mockSendChat.mockRejectedValue(new Error("model is overloaded"));
    render(<ChatWindow topic="Circuit Analysis" />);

    await userEvent.type(
      screen.getByPlaceholderText("Ask about a concept, problem, or derivation…"),
      "hi"
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("model is overloaded")).toBeInTheDocument();
    expect(screen.getByText("hi")).toBeInTheDocument();
  });

  it("only shows the Save conversation button once there is history", async () => {
    render(<ChatWindow topic="Circuit Analysis" />);
    expect(screen.queryByText("Save conversation")).not.toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText("Ask about a concept, problem, or derivation…"),
      "hi"
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Save conversation")).toBeInTheDocument();
  });

  it("carries prior turns as conversation history on the next send", async () => {
    render(<ChatWindow topic="Circuit Analysis" />);
    const textarea = screen.getByPlaceholderText("Ask about a concept, problem, or derivation…");

    await userEvent.type(textarea, "first question");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByText("Ohm's law is V = IR.")).toBeInTheDocument());

    await userEvent.type(textarea, "follow up");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(mockSendChat).toHaveBeenLastCalledWith(
      [
        { role: "user", content: "first question" },
        { role: "assistant", content: "Ohm's law is V = IR." },
        { role: "user", content: "follow up" },
      ],
      "Circuit Analysis"
    );
  });
});
