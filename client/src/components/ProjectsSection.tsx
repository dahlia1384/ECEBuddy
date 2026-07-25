import { useEffect, useState } from "react";
import { loadProjects, createProject, onProjectsChanged, type Project } from "../storage";
import ProjectCard from "./ProjectCard";

interface Props {
  topics: string[];
}

export default function ProjectsSection({ topics }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");

  function refresh() {
    setProjects(loadProjects());
  }

  useEffect(() => {
    refresh();
    return onProjectsChanged(refresh);
  }, []);

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    createProject(name);
    setNewName("");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Projects &amp; courses</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Group your files, saved chats, and quiz results by course — everything is stored in this
          browser. Use "Save to project" from a chat or quiz, or add files directly here.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New project name (e.g. ECE 210 — Signals)"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          New project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-slate-400">
          No projects yet. Create one above to start collecting files and chats for a course.
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} topics={topics} onChanged={refresh} />
          ))}
        </div>
      )}
    </section>
  );
}
