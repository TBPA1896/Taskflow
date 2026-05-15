import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { COOKIE_NAME, signToken } from "../auth.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const emailField = z
  .string()
  .email()
  .transform((value) => normalizeEmail(value));

const registerSchema = z.object({
  email: emailField,
  password: z.string().min(8),
  name: z.string().trim().min(1).max(80),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const exact = await prisma.user.findUnique({ where: { email: normalized } });
  if (exact) return exact;

  const legacy = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      password: string;
      name: string;
      createdAt: Date;
    }>
  >`SELECT id, email, password, name, createdAt FROM User WHERE lower(email) = ${normalized} LIMIT 1`;

  return legacy[0] ?? null;
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password, name } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  res.cookie(COOKIE_NAME, token, cookieOptions);

  res.status(201).json({ user, token });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  let user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.email !== email) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true,
      },
    });
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.cookie(COOKIE_NAME, token, cookieOptions);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path,
  });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
