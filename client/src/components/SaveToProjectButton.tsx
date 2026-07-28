import { useState } from "react";
import { loadProjects, createProject, type Project } from "../storage";

interface Props {
  onSave: (project: Project) => void | Promise<void>;
  label?: string;
}

export default function SaveToProjectButton({ onSave, label = "Save to project" }: Props) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPicker() {
    setError(null);
    setOpen(true);
    try {
      setProjects(await loadProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    }
  }

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  async function handlePick(project: Project) {
    try {
      await onSave(project);
      setOpen(false);
      flashSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      const project = await createProject(name);
      await onSave(project);
      setNewName("");
      setOpen(false);
      flashSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={openPicker}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
      >
        {savedFlash ? "Saved ✓" : label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-1.5 px-1 text-xs font-medium text-slate-400">Save to…</p>
            {error && <p className="mb-1.5 px-1 text-xs text-red-500">{error}</p>}
            <div className="max-h-40 overflow-y-auto">
              {projects.length === 0 && (
                <p className="px-1 py-1 text-xs text-slate-400">No projects yet — create one below.</p>
              )}
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePick(p)}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="New project name"
                className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950"
              />
              <button
                onClick={handleCreate}
                className="shrink-0 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
