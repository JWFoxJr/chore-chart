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

// GET /completions/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=...
// Returns completion counts grouped by day (YYYY-MM-DD) for calendar month view.

completionsRouter.get("/completions/summary", async (req, res, next) => {
  try {
    const getQ = (v: unknown): string | null => {
      if (typeof v === "string") return v.trim();
      if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
      return null;
    };

    const from = getQ(req.query.from);
    const to = getQ(req.query.to);
    const userId = getQ(req.query.userId);

    const isoDay = /^\d{4}-\d{2}-\d{2}$/;

    if (!from || !isoDay.test(from)) {
      return res.status(400).json({
        error: "From is required in YYYY-MM-DD format",
        example: "/completions/summary?from=2026-01-01&to=2026-01-31",
        received: req.query.from,
      });
    }

    if (!to || !isoDay.test(to)) {
      return res.status(400).json({
        error: "To is required in YYYY-MM-DD format",
        example: "/completions/summary?from=2026-01-01&to=2026-01-31",
        received: req.query.to,
      });
    }

    // Inclusive local-day window: [from 00:00:00, to 23:59:59.999]
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "invalid from/to date" });
    }

    if (start > end) {
      return res.status(400).json({ error: "from must be <= to" });
    }

    // Build WHERE clause
    const where: Record<string, any> = {
      completedAt: { gte: start, lte: end },
    };

    // Use raw SQL to group by day in SQLite reliably.
    // We pass ISO timestamps so SQLite can compare properly.
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const trimmedUserId =
      typeof userId === "string" && userId.trim().length > 0
        ? userId.trim()
        : null;

    // Conditional SQL for useId (to avoid weird templating issues)
    const rows = trimmedUserId
      ? await prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT
            date("completedAt") as date,
            COUNT(*) as count
          FROM "ChoreCompletion"
          WHERE
            "completedAt" >= ${startIso}
            AND "completedAt" <= ${endIso}
            AND "userId" = ${trimmedUserId}
          GROUP BY date
          ORDER BY date ASC
        `
      : await prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT
            date("completedAt") as date,
            COUNT(*) as count
          FROM "ChoreCompletion"
          WHERE
            "completedAt" >= ${startIso}
            AND "completedAt" <= ${endIso}
          GROUP BY date
          ORDER BY date ASC
        `;

    res.json({
      from,
      to,
      days: rows.map((r) => ({ date: r.date, count: Number(r.count) })),
    });
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
