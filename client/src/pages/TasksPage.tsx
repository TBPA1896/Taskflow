import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";
import { applyTaskEvent, useTasksSocket } from "@/hooks/useTasksSocket";
import type { Task, TaskSocketEvent, TaskStatus } from "@/types";

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
];

function statusStyles(status: TaskStatus) {
  switch (status) {
    case "DONE":
      return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30";
    case "IN_PROGRESS":
      return "bg-amber-500/15 text-amber-100 ring-amber-500/35";
    default:
      return "bg-slate-500/15 text-slate-200 ring-white/10";
  }
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { tasks: list } = await api<{ tasks: Task[] }>("/api/tasks");
      setTasks(list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSocketChange = useCallback((event: TaskSocketEvent) => {
    setTasks((prev) => applyTaskEvent(prev, event));
  }, []);

  useTasksSocket(true, { onChange: onSocketChange });

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const { task } = await api<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return [task, ...prev];
      });
      setTitle("");
      setDescription("");
    } catch {
      /* surface via toast in a larger app */
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    try {
      const { task } = await api<{ task: Task }>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    } catch {
      void load();
    }
  }

  async function removeTask(id: string) {
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      void load();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-400">
        Loading tasks…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-100">
        <p className="font-medium">Something went wrong</p>
        <p className="mt-1 text-sm text-rose-200/90">{loadError}</p>
        <button
          type="button"
          className="mt-3 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
          onClick={() => void load()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-lg shadow-black/20 backdrop-blur sm:p-6">
        <h2 className="text-lg font-semibold text-white">New task</h2>
        <p className="mt-1 text-sm text-slate-400">
          Capture something quickly. You can change status later.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createTask}>
          <label className="sm:col-span-2">
            <span className="text-sm font-medium text-slate-200">Title</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-sky-500/30 focus:ring-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Draft project brief"
              maxLength={200}
              required
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-medium text-slate-200">
              Description{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </span>
            <textarea
              className="mt-1 min-h-[88px] w-full resize-y rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-sky-500/30 focus:ring-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context, links, or acceptance criteria."
              maxLength={5000}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60 sm:w-auto"
            >
              {creating ? "Adding…" : "Add task"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold text-white">All tasks</h2>
          <p className="text-sm text-slate-500">
            {tasks.length === 0
              ? "No tasks yet."
              : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/30 p-8 text-center text-slate-400">
            Create your first task above. Updates sync in real time across tabs.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/55 p-4 shadow-md shadow-black/20 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    {task.description ? (
                      <p className="mt-1 line-clamp-3 text-sm text-slate-400">
                        {task.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles(task.status)}`}
                  >
                    {statuses.find((s) => s.value === task.status)?.label ??
                      task.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                    <select
                      className="ml-2 rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1.5 text-sm text-slate-100 outline-none ring-sky-500/30 focus:ring-2"
                      value={task.status}
                      onChange={(e) =>
                        void updateStatus(task.id, e.target.value as TaskStatus)
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="ml-auto rounded-lg border border-white/10 px-3 py-1.5 text-sm text-rose-200 transition hover:bg-rose-500/10"
                    onClick={() => void removeTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
