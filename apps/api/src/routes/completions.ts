import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const completionsRouter = Router();

// GET /completions?date=YYYY-MM-DD&userId=...

completionsRouter.get("/completions", async (req, res, next) => {
  try {
    const { date, userId } = req.query as { date?: string; userId?: string };

    const args: Parameters<typeof prisma.choreCompletion.findMany>[0] = {
      include: { user: true, chore: true },
      orderBy: { completedAt: "asc" },
    };

    const where: Record<string, any> = {};

    if (typeof userId === "string" && userId.length > 0) {
      where.userId = userId;
    }

    // If date provided, filter to that local-day window
    if (typeof date === "string" && date.length > 0) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.completedAt = { gte: start, lte: end };
    }

    if (Object.keys(where).length > 0) {
      args.where = where as any;
    }

    const completions = await prisma.choreCompletion.findMany(args);
    res.json(completions);
  } catch (err) {
    next(err);
  }
});

// POST /completions { userId, choreId, date }

completionsRouter.post("/completions", async (req, res, next) => {
  try {
    const { userId, choreId, date } = req.body as {
      userId?: unknown;
      choreId?: unknown;
      date?: unknown;
    };

    if (typeof userId !== "string" || userId.trim().length === 0) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (typeof choreId !== "string" || choreId.trim().length === 0) {
      return res.status(400).json({ error: "choreId is required" });
    }

    let when = new Date();
    if (typeof date === "string" && date.length > 0) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "invalid date" });
      }
      when = parsed;
    }

    const completion = await prisma.choreCompletion.create({
      data: {
        userId: userId.trim(),
        choreId: choreId.trim(),
        completedAt: when,
      },
      include: { user: true, chore: true },
    });

    res.status(201).json(completion);
  } catch (err) {
    next(err);
  }
});
