import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectTopicChat from "./ProjectTopicChat";
import { sendChat } from "../api";
import type { SavedFile } from "../storage";

vi.mock("../api", () => ({ sendChat: vi.fn() }));

const mockSendChat = vi.mocked(sendChat);

const SAMPLE_FILE: SavedFile = {
  id: "f1",
  mimeType: "application/pdf",
  data: "abc",
  name: "notes.pdf",
  savedAt: 1,
};

async function sendMessage(text: string) {
  const textarea = screen.getByPlaceholderText(/Ask a question/);
  await userEvent.type(textarea, text);
  await userEvent.click(screen.getByRole("button", { name: "Send" }));
}

describe("ProjectTopicChat", () => {
  beforeEach(() => {
    mockSendChat.mockReset();
    mockSendChat.mockResolvedValue("Here's the answer.");
  });

  it("prompts to ask about saved files when files exist", () => {
    render(<ProjectTopicChat topic="Circuit Analysis" files={[SAMPLE_FILE]} />);
    expect(screen.getByText(/Ask about the 1 saved file in this topic/)).toBeInTheDocument();
  });

  it("prompts generically when there are no files", () => {
    render(<ProjectTopicChat topic="Circuit Analysis" files={[]} />);
    expect(screen.getByText("Ask a question about this topic")).toBeInTheDocument();
  });

  it("pluralizes the file count", () => {
    render(<ProjectTopicChat topic="Circuit Analysis" files={[SAMPLE_FILE, { ...SAMPLE_FILE, id: "f2" }]} />);
    expect(screen.getByText(/Ask about the 2 saved files in this topic/)).toBeInTheDocument();
  });

  it("attaches saved files only on the first message", async () => {
    render(<ProjectTopicChat topic="Circuit Analysis" files={[SAMPLE_FILE]} />);

    await sendMessage("What does this cover?");
    await waitFor(() => expect(screen.getByText("Here's the answer.")).toBeInTheDocument());

    expect(mockSendChat).toHaveBeenNthCalledWith(
      1,
      [
        {
          role: "user",
          content: "What does this cover?",
          attachments: [{ mimeType: "application/pdf", data: "abc", name: "notes.pdf" }],
        },
      ],
      "Circuit Analysis"
    );

    await sendMessage("Follow up question");
    await waitFor(() => expect(mockSendChat).toHaveBeenCalledTimes(2));

    const secondCallMessages = mockSendChat.mock.calls[1][0];
    expect(secondCallMessages[secondCallMessages.length - 1]).toEqual({
      role: "user",
      content: "Follow up question",
    });
  });

  it("does not attach anything when there are no saved files", async () => {
    render(<ProjectTopicChat topic="Circuit Analysis" files={[]} />);

    await sendMessage("hello");
    await waitFor(() => expect(mockSendChat).toHaveBeenCalled());

    expect(mockSendChat).toHaveBeenCalledWith([{ role: "user", content: "hello" }], "Circuit Analysis");
  });

  it("shows an error message when the request fails", async () => {
    mockSendChat.mockRejectedValue(new Error("model is overloaded"));
    render(<ProjectTopicChat topic="Circuit Analysis" files={[]} />);

    await sendMessage("hi");

    expect(await screen.findByText("model is overloaded")).toBeInTheDocument();
  });

  it("disables Send until there is input", () => {
    render(<ProjectTopicChat topic="Circuit Analysis" files={[]} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
