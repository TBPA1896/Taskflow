import type { IncomingHttpHeaders } from "http";
import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { COOKIE_NAME, verifyToken } from "./auth.js";

export type TaskEvent =
  | { type: "task:created"; task: unknown }
  | { type: "task:updated"; task: unknown }
  | { type: "task:deleted"; id: string };

let io: Server | null = null;

function readCookie(headers: IncomingHttpHeaders, name: string): string | undefined {
  const raw = headers.cookie;
  if (!raw) return undefined;
  const parts = raw.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

function tokenFromHandshake(headers: IncomingHttpHeaders, authToken: unknown) {
  if (typeof authToken === "string" && authToken.length > 0) return authToken;
  const header = headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return readCookie(headers, COOKIE_NAME);
}

export function initSocket(httpServer: HttpServer) {
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

  io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = tokenFromHandshake(
      socket.handshake.headers,
      socket.handshake.auth?.token,
    );

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const { userId } = verifyToken(token);
      socket.data.userId = userId as string;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
  });

  return io;
}

export function emitToUser(userId: string, payload: TaskEvent) {
  io?.to(`user:${userId}`).emit("tasks:change", payload);
}
