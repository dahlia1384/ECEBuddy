import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadProjects,
  createProject,
  deleteProject,
  addFilesToProject,
  removeFileFromProject,
  onProjectsChanged,
  type Project,
} from "./storage";

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

const sampleProject: Project = { id: "p1", name: "ECE 210", createdAt: 1, topics: {} };

describe("storage (server-backed projects API)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("loadProjects issues a GET with credentials included", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse({ projects: [sampleProject] }));

    const projects = await loadProjects();

    expect(projects).toEqual([sampleProject]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/projects");
    expect(init.credentials).toBe("include");
    expect(init.method).toBeUndefined();
  });

  it("createProject POSTs the name and fires the change event", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse({ project: sampleProject }));

    const listener = vi.fn();
    const unsubscribe = onProjectsChanged(listener);

    const result = await createProject("ECE 210");

    expect(result).toEqual(sampleProject);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/projects");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ name: "ECE 210" });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("throws the server's error message on a failed request", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse({ error: "Project name is required" }, 400));

    await expect(createProject("")).rejects.toThrow("Project name is required");
  });

  it("falls back to a generic error when the response has no error field", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    await expect(loadProjects()).rejects.toThrow("Request failed");
  });

  it("deleteProject issues a DELETE to the project id and notifies listeners", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ status: 204, ok: true, json: async () => ({}) } as Response);

    const listener = vi.fn();
    const unsubscribe = onProjectsChanged(listener);

    await deleteProject("p1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/projects/p1");
    expect(init.method).toBe("DELETE");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("addFilesToProject posts topic and files to the right sub-path", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse({ project: sampleProject }));

    await addFilesToProject("p1", "Circuit Analysis", [{ mimeType: "image/png", data: "abc" }]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/projects/p1/files");
    expect(JSON.parse(init.body)).toEqual({
      topic: "Circuit Analysis",
      files: [{ mimeType: "image/png", data: "abc" }],
    });
  });

  it("removeFileFromProject URL-encodes the topic query param", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse({ project: sampleProject }));

    await removeFileFromProject("p1", "Signals & Systems", "f1");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/projects/p1/files/f1?topic=Signals%20%26%20Systems");
  });
});
