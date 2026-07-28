import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveToProjectButton from "./SaveToProjectButton";
import { loadProjects, createProject, type Project } from "../storage";

vi.mock("../storage", () => ({
  loadProjects: vi.fn(),
  createProject: vi.fn(),
}));

const mockLoadProjects = vi.mocked(loadProjects);
const mockCreateProject = vi.mocked(createProject);

const SAMPLE: Project = { id: "p1", name: "ECE 210", createdAt: 1, topics: {} };

describe("SaveToProjectButton", () => {
  beforeEach(() => {
    mockLoadProjects.mockReset();
    mockCreateProject.mockReset();
    mockLoadProjects.mockResolvedValue([]);
  });

  it("opens the picker and loads projects on click", async () => {
    mockLoadProjects.mockResolvedValue([SAMPLE]);
    render(<SaveToProjectButton onSave={vi.fn()} />);

    await userEvent.click(screen.getByText("Save to project"));

    expect(mockLoadProjects).toHaveBeenCalled();
    expect(await screen.findByText("ECE 210")).toBeInTheDocument();
  });

  it("shows a placeholder when there are no projects", async () => {
    render(<SaveToProjectButton onSave={vi.fn()} />);
    await userEvent.click(screen.getByText("Save to project"));

    expect(await screen.findByText(/No projects yet/)).toBeInTheDocument();
  });

  it("picks an existing project, calls onSave, and flashes Saved", async () => {
    mockLoadProjects.mockResolvedValue([SAMPLE]);
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SaveToProjectButton onSave={onSave} />);

    await userEvent.click(screen.getByText("Save to project"));
    await userEvent.click(await screen.findByText("ECE 210"));

    expect(onSave).toHaveBeenCalledWith(SAMPLE);
    expect(await screen.findByText("Saved ✓")).toBeInTheDocument();
    expect(screen.queryByText(/No projects yet/)).not.toBeInTheDocument();
  });

  it("creates a new project, calls onSave with it, and closes the picker", async () => {
    mockCreateProject.mockResolvedValue(SAMPLE);
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SaveToProjectButton onSave={onSave} />);

    await userEvent.click(screen.getByText("Save to project"));
    await userEvent.type(await screen.findByPlaceholderText("New project name"), "ECE 210");
    await userEvent.click(screen.getByText("Create"));

    expect(mockCreateProject).toHaveBeenCalledWith("ECE 210");
    expect(onSave).toHaveBeenCalledWith(SAMPLE);
    expect(await screen.findByText("Saved ✓")).toBeInTheDocument();
  });

  it("submits create on Enter", async () => {
    mockCreateProject.mockResolvedValue(SAMPLE);
    render(<SaveToProjectButton onSave={vi.fn().mockResolvedValue(undefined)} />);

    await userEvent.click(screen.getByText("Save to project"));
    await userEvent.type(await screen.findByPlaceholderText("New project name"), "ECE 210{Enter}");

    expect(mockCreateProject).toHaveBeenCalledWith("ECE 210");
  });

  it("shows an error when loading projects fails", async () => {
    mockLoadProjects.mockRejectedValue(new Error("Not signed in"));
    render(<SaveToProjectButton onSave={vi.fn()} />);

    await userEvent.click(screen.getByText("Save to project"));

    expect(await screen.findByText("Not signed in")).toBeInTheDocument();
  });

  it("keeps the picker open and shows an error when saving to an existing project fails", async () => {
    mockLoadProjects.mockResolvedValue([SAMPLE]);
    const onSave = vi.fn().mockRejectedValue(new Error("Project not found"));
    render(<SaveToProjectButton onSave={onSave} />);

    await userEvent.click(screen.getByText("Save to project"));
    await userEvent.click(await screen.findByText("ECE 210"));

    expect(await screen.findByText("Project not found")).toBeInTheDocument();
    expect(screen.queryByText("Saved ✓")).not.toBeInTheDocument();
  });

  it("shows an error when project creation fails", async () => {
    mockCreateProject.mockRejectedValue(new Error("Project name is required"));
    render(<SaveToProjectButton onSave={vi.fn()} />);

    await userEvent.click(screen.getByText("Save to project"));
    await userEvent.type(await screen.findByPlaceholderText("New project name"), "x");
    await userEvent.click(screen.getByText("Create"));

    expect(await screen.findByText("Project name is required")).toBeInTheDocument();
  });

  it("closes the picker when clicking the backdrop overlay", async () => {
    const { container } = render(<SaveToProjectButton onSave={vi.fn()} />);
    await userEvent.click(screen.getByText("Save to project"));
    await screen.findByText(/No projects yet/);

    const overlay = container.querySelector(".fixed.inset-0") as HTMLElement;
    await userEvent.click(overlay);

    await waitFor(() => expect(screen.queryByText(/No projects yet/)).not.toBeInTheDocument());
  });
});
