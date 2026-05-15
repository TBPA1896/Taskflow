import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-white/10 text-white"
      : "text-slate-300 hover:bg-white/5 hover:text-white",
  ].join(" ");

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sky-300/90">
            Taskflow
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Your tasks
          </h1>
          {user ? (
            <p className="mt-1 text-sm text-slate-400">
              Signed in as{" "}
              <span className="font-medium text-slate-200">{user.name}</span>
            </p>
          ) : null}
        </div>
        {user ? (
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/tasks" className={linkClass}>
              Tasks
            </NavLink>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Sign out
            </button>
          </nav>
        ) : null}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
