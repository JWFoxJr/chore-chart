import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const reportsRouter = Router();

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) == value
  );
}

function startOfWeek(value: Date) {
  const start = new Date(value);

  start.setHours(0, 0, 0, 0);

  const daysSinceSunday = start.getDay();

  start.setDate(start.getDate() - daysSinceSunday);

  return start;
}

function subtractMonths(value: Date, months: number) {
  const result = new Date(value);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() - months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));

  return result;
}

reportsRouter.get("/reports/points", async (req, res, next) => {
  try {
    const from = req.query.from;
    const to = req.query.to;

    if (
      typeof from != "string" ||
      typeof to != "string" ||
      from == "" ||
      to == ""
    ) {
      return res.status(400).json({
        error: "from and to dates are required",
      });
    }

    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({
        error: "from and to must be valid dates in YYYY-MM-DD format",
      });
    }

    if (from > to) {
      return res.status(400).json({
        error: "from must be on or before to",
      });
    }

    const rangeStart = new Date(from + "T00:00:00");
    const rangeEndExclusive = new Date(to + "T00:00:00");

    rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        completions: {
          select: {
            pointsAwarded: true,
            completedAt: true,
          },
        },
      },
    });

    const report = [];

    for (const user of users) {
      let lifetimePoints = 0;
      let rangePoints = 0;

      for (const completion of user.completions) {
        lifetimePoints = lifetimePoints + completion.pointsAwarded;

        if (
          completion.completedAt >= rangeStart &&
          completion.completedAt < rangeEndExclusive
        ) {
          rangePoints = rangePoints + completion.pointsAwarded;
        }
      }

      report.push({
        userId: user.id,
        name: user.name,
        lifetimePoints: lifetimePoints,
        rangePoints: rangePoints,
      });
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get("/reports/trends", async (req, res, next) => {
  const interval = req.query.interval;
  const metric = req.query.metric;
  const range = req.query.range ?? "3M";

  if (interval !== "week") {
    return res.status(400).json({
      error: "interval must be week",
    });
  }

  if (metric !== "points" && metric !== "count") {
    return res.status(400).json({
      error: "metric must be points or count",
    });
  }

  const allowedRanges = ["1W", "1M", "3M", "6M", "12M", "ALL"];

  if (typeof range !== "string" || !allowedRanges.includes(range)) {
    return res.status(400).json({
      error: "range must be 1W, 1M, 3M, 6M, 12M, or ALL",
    });
  }

  try {
    const now = new Date();
    const weekStart = startOfWeek(now);

    let rangeStart: Date | null = null;

    if (range === "1W") {
      rangeStart = weekStart;
    } else if (range === "1M") {
      rangeStart = subtractMonths(now, 1);
    } else if (range === "3M") {
      rangeStart = subtractMonths(now, 3);
    } else if (range === "6M") {
      rangeStart = subtractMonths(now, 6);
    } else if (range === "12M") {
      rangeStart = subtractMonths(now, 12);
    } else if (range === "ALL") {
      const earliest = await prisma.choreCompletion.findFirst({
        where: {
          completedAt: { lte: now },
        },
        orderBy: {
          completedAt: "asc",
        },
        select: {
          completedAt: true,
        },
      });

      if (earliest !== null) {
        rangeStart = startOfWeek(earliest.completedAt);
      } else {
        rangeStart = weekStart;
      }
    }

    if (rangeStart === null) {
      throw new Error("Unable to determine the range start.");
    }

    rangeStart.setHours(0, 0, 0, 0);

    const weeks: { weekStart: Date; value: number }[] = [];

    const cursor = startOfWeek(rangeStart);

    while (cursor <= weekStart) {
      weeks.push({
        weekStart: new Date(cursor),
        value: 0,
      });

      cursor.setDate(cursor.getDate() + 7);
    }

    const completions = await prisma.choreCompletion.findMany({
      where: {
        completedAt: {
          gte: rangeStart,
          lte: now,
        },
      },
      select: {
        completedAt: true,
        pointsAwarded: true,
      },
    });

    for (const completion of completions) {
      const completionWeek = startOfWeek(completion.completedAt);

      const bucket = weeks.find(
        (week) => week.weekStart.getTime() === completionWeek.getTime(),
      );

      if (bucket === undefined) {
        throw new Error("Completion falls outside the weekly buckets.");
      }

      if (metric === "points") {
        bucket.value = bucket.value + completion.pointsAwarded;
      } else {
        bucket.value = bucket.value + 1;
      }
    }

    res.json({
      interval,
      metric,
      range,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      weekStart,
      rangeStart,
      weeks,
    });
  } catch (err) {
    next(err);
  }
});
