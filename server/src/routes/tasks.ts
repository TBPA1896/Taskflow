import { Router } from "express";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";
import { prisma } from "../db.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { emitToUser } from "../socket.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  status: z.nativeEnum(TaskStatus).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

router.get("/", async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ tasks });
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { userId } = req as AuthedRequest;
  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      status: parsed.data.status ?? TaskStatus.TODO,
      userId,
    },
  });

  emitToUser(userId, { type: "task:created", task });
  res.status(201).json({ task });
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { userId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const task = await prisma.task.update({
    where: { id },
    data: parsed.data,
  });
  emitToUser(userId, { type: "task:updated", task });
  res.json({ task });
});

router.delete("/:id", async (req, res) => {
  const { userId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await prisma.task.delete({ where: { id } });
  emitToUser(userId, { type: "task:deleted", id });
  res.status(204).send();
});

export default router;
