import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectCard from "./ProjectCard";
import {
  addFilesToProject,
  removeFileFromProject,
  removeChatFromProject,
  removeQuizFromProject,
  deleteProject,
  type Project,
} from "../storage";

vi.mock("../storage", () => ({
  addFilesToProject: vi.fn(),
  removeFileFromProject: vi.fn(),
  removeChatFromProject: vi.fn(),
  removeQuizFromProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock("./ProjectTopicChat", () => ({
  default: ({ topic, files }: { topic: string; files: unknown[] }) => (
    <div>TOPIC_CHAT:{topic}:{files.length}</div>
  ),
}));

const mockAddFiles = vi.mocked(addFilesToProject);
const mockRemoveFile = vi.mocked(removeFileFromProject);
const mockRemoveChat = vi.mocked(removeChatFromProject);
const mockRemoveQuiz = vi.mocked(removeQuizFromProject);
const mockDeleteProject = vi.mocked(deleteProject);

const EMPTY_PROJECT: Project = { id: "p1", name: "ECE 210", createdAt: 1706000000000, topics: {} };

const PROJECT_WITH_DATA: Project = {
  id: "p1",
  name: "ECE 210",
  createdAt: 1706000000000,
  topics: {
    "Circuit Analysis": {
      files: [{ id: "f1", mimeType: "application/pdf", data: "abc", name: "notes.pdf", savedAt: 1 }],
      chats: [
        {
          id: "c1",
          savedAt: 1,
          messages: [
            { role: "user", content: "What is KCL?" },
            { role: "assistant", content: "Conservation of charge." },
          ],
        },
      ],
      quizzes: [
        {
          id: "q1",
          difficulty: "intro",
          savedAt: 1,
          score: 1,
          answers: { 0: 0 },
          questions: [
            { question: "What is Ohm's law?", choices: ["V=IR", "F=ma", "E=mc^2", "P=VI"], correctIndex: 0, explanation: "Because." },
          ],
        },
      ],
    },
  },
};

async function expandCard() {
  await userEvent.click(screen.getByText("ECE 210"));
}

describe("ProjectCard", () => {
  beforeEach(() => {
    mockAddFiles.mockReset().mockResolvedValue(undefined);
    mockRemoveFile.mockReset().mockResolvedValue(undefined);
    mockRemoveChat.mockReset().mockResolvedValue(undefined);
    mockRemoveQuiz.mockReset().mockResolvedValue(undefined);
    mockDeleteProject.mockReset().mockResolvedValue(undefined);
  });

  it("shows the name and counts collapsed by default", () => {
    render(<ProjectCard project={PROJECT_WITH_DATA} topics={["Circuit Analysis"]} onChanged={vi.fn()} />);

    expect(screen.getByText("ECE 210")).toBeInTheDocument();
    expect(screen.getByText(/1 files · 1 chats · 1 quizzes/)).toBeInTheDocument();
    expect(screen.queryByText("Delete project")).not.toBeInTheDocument();
  });

  it("expands to show controls and topic data on click", async () => {
    render(<ProjectCard project={PROJECT_WITH_DATA} topics={["Circuit Analysis"]} onChanged={vi.fn()} />);
    await expandCard();

    expect(screen.getByText("Delete project")).toBeInTheDocument();
    expect(screen.getByText("+ Add files to this topic")).toBeInTheDocument();
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
    expect(screen.getByText("TOPIC_CHAT:Circuit Analysis:1")).toBeInTheDocument();
  });

  it("shows a placeholder when there is no saved data yet", async () => {
    render(<ProjectCard project={EMPTY_PROJECT} topics={["Circuit Analysis"]} onChanged={vi.fn()} />);
    await expandCard();

    expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument();
  });

  it("removes a file and notifies the parent", async () => {
    const onChanged = vi.fn();
    render(<ProjectCard project={PROJECT_WITH_DATA} topics={["Circuit Analysis"]} onChanged={onChanged} />);
    await expandCard();

    await userEvent.click(screen.getByRole("button", { name: "Remove notes.pdf" }));

    expect(mockRemoveFile).toHaveBeenCalledWith("p1", "Circuit Analysis", "f1");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("toggles and removes a saved chat", async () => {
    const onChanged = vi.fn();
    render(<ProjectCard project={PROJECT_WITH_DATA} topics={["Circuit Analysis"]} onChanged={onChanged} />);
    await expandCard();

    await userEvent.click(screen.getByText(/Saved chat/));
    expect(screen.getByText("What is KCL?")).toBeInTheDocument();

    await userEvent.click(screen.getAllByText("Remove")[0]);
    expect(mockRemoveChat).toHaveBeenCalledWith("p1", "Circuit Analysis", "c1");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("toggles and removes a saved quiz", async () => {
    const onChanged = vi.fn();
    render(<ProjectCard project={PROJECT_WITH_DATA} topics={["Circuit Analysis"]} onChanged={onChanged} />);
    await expandCard();

    await userEvent.click(screen.getByText(/Quiz result/));
    expect(screen.getByText(/What is Ohm's law\?/)).toBeInTheDocument();
    expect(screen.getByText(/Your answer: V=IR/)).toBeInTheDocument();

    await userEvent.click(screen.getAllByText("Remove")[1]);
    expect(mockRemoveQuiz).toHaveBeenCalledWith("p1", "Circuit Analysis", "q1");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("deletes the project when confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onChanged = vi.fn();
    render(<ProjectCard project={PROJECT_WITH_DATA} topics={["Circuit Analysis"]} onChanged={onChanged} />);
    await expandCard();

    await userEvent.click(screen.getByText("Delete project"));

    expect(mockDeleteProject).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("does not delete the project when the confirmation is dismissed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProjectCard project={PROJECT_WITH_DATA} topics={["Circuit Analysis"]} onChanged={vi.fn()} />);
    await expandCard();

    await userEvent.click(screen.getByText("Delete project"));

    expect(mockDeleteProject).not.toHaveBeenCalled();
  });

  it("uploads a file to the selected topic", async () => {
    const onChanged = vi.fn();
    const { container } = render(
      <ProjectCard project={EMPTY_PROJECT} topics={["Circuit Analysis", "Signals & Systems"]} onChanged={onChanged} />
    );
    await expandCard();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-pdf-bytes"], "assignment.pdf", { type: "application/pdf" });

    await userEvent.upload(fileInput, file);

    await waitFor(() =>
      expect(mockAddFiles).toHaveBeenCalledWith(
        "p1",
        "Circuit Analysis",
        [expect.objectContaining({ mimeType: "application/pdf", name: "assignment.pdf" })]
      )
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("shows an error when saving the uploaded file fails", async () => {
    mockAddFiles.mockRejectedValue(new Error("Project not found"));
    const { container } = render(
      <ProjectCard project={EMPTY_PROJECT} topics={["Circuit Analysis"]} onChanged={vi.fn()} />
    );
    await expandCard();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-pdf-bytes"], "assignment.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput, file);

    expect(await screen.findByText("Project not found")).toBeInTheDocument();
  });

  it("shows an error for an unsupported file type without calling addFilesToProject", async () => {
    const { container } = render(
      <ProjectCard project={EMPTY_PROJECT} topics={["Circuit Analysis"]} onChanged={vi.fn()} />
    );
    await expandCard();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    // userEvent.upload respects the input's `accept` filter like a real OS
    // picker would; fireEvent bypasses that to exercise the component's own
    // mime-type guard directly (e.g. drag-and-drop can still deliver these).
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText(/unsupported file type/)).toBeInTheDocument();
    expect(mockAddFiles).not.toHaveBeenCalled();
  });
});
