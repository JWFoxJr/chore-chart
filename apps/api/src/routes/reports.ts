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
