import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsSection from "./ProjectsSection";
import { loadProjects, createProject, onProjectsChanged, type Project } from "../storage";

vi.mock("../storage", () => ({
  loadProjects: vi.fn(),
  createProject: vi.fn(),
  onProjectsChanged: vi.fn(),
}));

vi.mock("./ProjectCard", () => ({
  default: ({ project }: { project: Project }) => <div>PROJECT_CARD:{project.name}</div>,
}));

const mockLoadProjects = vi.mocked(loadProjects);
const mockCreateProject = vi.mocked(createProject);
const mockOnProjectsChanged = vi.mocked(onProjectsChanged);

const SAMPLE: Project = { id: "p1", name: "ECE 210", createdAt: 1, topics: {} };

describe("ProjectsSection", () => {
  beforeEach(() => {
    mockLoadProjects.mockReset();
    mockCreateProject.mockReset();
    mockOnProjectsChanged.mockReset();
    mockLoadProjects.mockResolvedValue([]);
    mockOnProjectsChanged.mockReturnValue(() => {});
  });

  it("shows an empty-state message when there are no projects", async () => {
    render(<ProjectsSection topics={["Circuit Analysis"]} />);
    expect(await screen.findByText(/No projects yet/)).toBeInTheDocument();
  });

  it("renders a ProjectCard per loaded project", async () => {
    mockLoadProjects.mockResolvedValue([SAMPLE, { ...SAMPLE, id: "p2", name: "ECE 350" }]);
    render(<ProjectsSection topics={["Circuit Analysis"]} />);

    expect(await screen.findByText("PROJECT_CARD:ECE 210")).toBeInTheDocument();
    expect(screen.getByText("PROJECT_CARD:ECE 350")).toBeInTheDocument();
  });

  it("disables the New project button until something is typed", async () => {
    render(<ProjectsSection topics={["Circuit Analysis"]} />);
    await screen.findByText(/No projects yet/);
    expect(screen.getByRole("button", { name: "New project" })).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText(/New project name/), "ECE 210");
    expect(screen.getByRole("button", { name: "New project" })).toBeEnabled();
  });

  it("creates a project with the trimmed name and clears the input", async () => {
    mockCreateProject.mockResolvedValue(SAMPLE);
    render(<ProjectsSection topics={["Circuit Analysis"]} />);
    await screen.findByText(/No projects yet/);

    const input = screen.getByPlaceholderText(/New project name/) as HTMLInputElement;
    await userEvent.type(input, "  ECE 210  ");
    await userEvent.click(screen.getByRole("button", { name: "New project" }));

    expect(mockCreateProject).toHaveBeenCalledWith("ECE 210");
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("submits on Enter", async () => {
    mockCreateProject.mockResolvedValue(SAMPLE);
    render(<ProjectsSection topics={["Circuit Analysis"]} />);
    await screen.findByText(/No projects yet/);

    await userEvent.type(screen.getByPlaceholderText(/New project name/), "ECE 210{Enter}");

    expect(mockCreateProject).toHaveBeenCalledWith("ECE 210");
  });

  it("shows an error message when loading projects fails", async () => {
    mockLoadProjects.mockRejectedValue(new Error("Not signed in"));
    render(<ProjectsSection topics={["Circuit Analysis"]} />);

    expect(await screen.findByText("Not signed in")).toBeInTheDocument();
  });

  it("shows an error message when creating a project fails", async () => {
    mockCreateProject.mockRejectedValue(new Error("Project name is required"));
    render(<ProjectsSection topics={["Circuit Analysis"]} />);
    await screen.findByText(/No projects yet/);

    await userEvent.type(screen.getByPlaceholderText(/New project name/), "x");
    await userEvent.click(screen.getByRole("button", { name: "New project" }));

    expect(await screen.findByText("Project name is required")).toBeInTheDocument();
  });

  it("refreshes the project list when notified of an external change", async () => {
    let capturedListener: () => void = () => {};
    mockOnProjectsChanged.mockImplementation((listener) => {
      capturedListener = listener;
      return () => {};
    });
    mockLoadProjects.mockResolvedValueOnce([]);
    render(<ProjectsSection topics={["Circuit Analysis"]} />);
    await screen.findByText(/No projects yet/);

    mockLoadProjects.mockResolvedValueOnce([SAMPLE]);
    capturedListener();

    expect(await screen.findByText("PROJECT_CARD:ECE 210")).toBeInTheDocument();
  });
});
