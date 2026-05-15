export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskSocketEvent =
  | { type: "task:created"; task: Task }
  | { type: "task:updated"; task: Task }
  | { type: "task:deleted"; id: string };
