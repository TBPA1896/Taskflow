import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifyToken } from "../auth.js";

export type AuthedRequest = Request & { userId: string; userEmail: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer =
    header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer || req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { userId, email } = verifyToken(token);
    (req as AuthedRequest).userId = userId;
    (req as AuthedRequest).userEmail = email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
