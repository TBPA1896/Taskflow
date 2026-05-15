import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET is required");
}
const JWT_SECRET: string = secret;

export const COOKIE_NAME = "token";
export const TOKEN_TTL = "7d";

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): { userId: string; email: string } {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  const payload = decoded as jwt.JwtPayload & {
    userId?: string;
    email?: string;
  };
  if (!payload.userId || !payload.email) {
    throw new Error("Invalid token");
  }
  return { userId: payload.userId, email: payload.email };
}
