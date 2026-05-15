import { useEffect } from "react";
import { io } from "socket.io-client";
import type { Task, TaskSocketEvent } from "@/types";

type Handlers = {
  onChange: (event: TaskSocketEvent) => void;
};

export function useTasksSocket(enabled: boolean, { onChange }: Handlers) {
  useEffect(() => {
    if (!enabled) return;

    const socket = io({
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    const handler = (payload: TaskSocketEvent) => {
      onChange(payload);
    };

    socket.on("tasks:change", handler);

    return () => {
      socket.off("tasks:change", handler);
      socket.close();
    };
  }, [enabled, onChange]);
}

export function applyTaskEvent(tasks: Task[], event: TaskSocketEvent): Task[] {
  if (event.type === "task:created") {
    if (tasks.some((t) => t.id === event.task.id)) return tasks;
    return [event.task, ...tasks];
  }
  if (event.type === "task:updated") {
    return tasks.map((t) => (t.id === event.task.id ? event.task : t));
  }
  return tasks.filter((t) => t.id !== event.id);
}
