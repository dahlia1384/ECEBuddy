import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizPanel from "./QuizPanel";
import { fetchQuiz } from "../api";
import { addQuizToProject } from "../storage";

vi.mock("../api", () => ({ fetchQuiz: vi.fn() }));
vi.mock("../storage", () => ({
  addQuizToProject: vi.fn(),
  loadProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn(),
}));

const mockFetchQuiz = vi.mocked(fetchQuiz);
const mockAddQuizToProject = vi.mocked(addQuizToProject);

const SAMPLE_QUESTIONS = [
  {
    question: "What is Ohm's law?",
    choices: [
      "Voltage equals current times resistance",
      "Force equals mass times acceleration",
      "Energy equals mass times c squared",
      "Power equals voltage times current",
    ],
    correctIndex: 0,
    explanation: "Because voltage equals current times resistance.",
  },
  {
    question: "What is KCL?",
    choices: [
      "The sum of currents into a node is zero",
      "The sum of voltages around a loop is zero",
      "Power equals voltage times current squared",
      "Charge equals capacitance times voltage",
    ],
    correctIndex: 0,
    explanation: "Conservation of charge at a node.",
  },
];

async function generateQuiz() {
  await userEvent.click(screen.getByRole("button", { name: /Generate/ }));
  await waitFor(() => expect(screen.getByText("What is Ohm's law?")).toBeInTheDocument());
}

describe("QuizPanel", () => {
  beforeEach(() => {
    mockFetchQuiz.mockReset();
    mockAddQuizToProject.mockReset();
    mockFetchQuiz.mockResolvedValue(SAMPLE_QUESTIONS);
  });

  it("shows an empty-state prompt before any quiz is generated", () => {
    render(<QuizPanel topic="Circuit Analysis" />);
    expect(screen.getByText(/Generate a quiz to start practicing circuit analysis/)).toBeInTheDocument();
  });

  it("generates and renders questions on button click", async () => {
    render(<QuizPanel topic="Circuit Analysis" />);
    await generateQuiz();

    expect(mockFetchQuiz).toHaveBeenCalledWith("Circuit Analysis", "intermediate", 5);
    expect(screen.getByText("What is KCL?")).toBeInTheDocument();
  });

  it("passes the selected difficulty through to fetchQuiz", async () => {
    render(<QuizPanel topic="Circuit Analysis" />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "advanced");
    await generateQuiz();

    expect(mockFetchQuiz).toHaveBeenCalledWith("Circuit Analysis", "advanced", 5);
  });

  it("shows an error message when generation fails", async () => {
    mockFetchQuiz.mockRejectedValue(new Error("model is overloaded"));
    render(<QuizPanel topic="Circuit Analysis" />);

    await userEvent.click(screen.getByRole("button", { name: /Generate/ }));

    expect(await screen.findByText("model is overloaded")).toBeInTheDocument();
  });

  it("marks the correct answer and the wrong pick after answering incorrectly", async () => {
    render(<QuizPanel topic="Circuit Analysis" />);
    await generateQuiz();

    await userEvent.click(screen.getByRole("button", { name: /Force equals mass times acceleration/ }));

    expect(screen.getByText("Because voltage equals current times resistance.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Force equals mass times acceleration/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Voltage equals current times resistance/ })).toBeDisabled();
  });

  it("locks in the choice and ignores further clicks on the same question", async () => {
    render(<QuizPanel topic="Circuit Analysis" />);
    await generateQuiz();

    await userEvent.click(screen.getByRole("button", { name: /Voltage equals current times resistance/ }));
    const explanationCountBefore = screen.getAllByText(
      "Because voltage equals current times resistance."
    ).length;

    // second click on an already-answered question's other choice should be a no-op (disabled)
    await userEvent.click(screen.getByRole("button", { name: /Force equals mass times acceleration/ }));

    expect(
      screen.getAllByText("Because voltage equals current times resistance.").length
    ).toBe(explanationCountBefore);
  });

  it("shows a running score once every question is answered", async () => {
    render(<QuizPanel topic="Circuit Analysis" />);
    await generateQuiz();

    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Voltage equals current times resistance/ })); // correct
    await userEvent.click(screen.getByRole("button", { name: /The sum of voltages around a loop is zero/ })); // wrong

    expect(await screen.findByText("Score: 1/2")).toBeInTheDocument();
  });

  it("only shows the Save results button once questions exist", async () => {
    render(<QuizPanel topic="Circuit Analysis" />);
    expect(screen.queryByText("Save results")).not.toBeInTheDocument();

    await generateQuiz();

    expect(screen.getByText("Save results")).toBeInTheDocument();
  });
});
