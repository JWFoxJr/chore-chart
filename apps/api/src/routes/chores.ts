import { Router } from 'express';
import { prisma } from "../db/prisma.js";

export const choresRouter = Router();

// GET /chores?active=true|false (optinoal)
choresRouter.get("/chores", async (req, res, next) => {
  try {
    const { active } = req.query;

    const args: Parameters<typeof prisma.chore.findMany>[0] = {
      orderBy: { title: "asc" },
    };

    if (typeof active === "string") {
      args.where = { active: active === "true" };
    }

    const chores = await prisma.chore.findMany(args);

    res.json(chores);
  } catch (err) {
    next(err);
  }
});


    // POST /chores { title, points? }
    choresRouter.post("/chores", async (req, res, next) => {
    try {
        const { title, points } = req.body as { title?: unknown; points?: unknown };

        if (typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({ error: "title is required" });
        }

        let parsedPoints: number | undefined;
        if (typeof points !== "undefined") {
            if (typeof points !== "number" || !Number.isInteger(points) || points < 0) {
                return res.status(400).json({ error: "points must be a non-negative integer" });
            }
            parsedPoints = points;
        }
        
        const chore = await prisma.chore.create({
            data: {
                title: title.trim(),
                ...(parsedPoints ? { points: parsedPoints } : {}),
            },
        });

        res.status(201).json(chore);
    } catch (err) {
        next(err);
    }
});

// PATCH /chores/:id { title?, points?, active? }
choresRouter.patch("/chores/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, points, active } = req.body as { 
            title?: unknown; 
            points?: unknown; 
            active?: unknown
        };

        const data: { title?: string; points?: number; active?: boolean } = {};

        if (typeof title === "string") data.title = title.trim();

        if (typeof points !== "undefined") {
            if (typeof points !== "number" || !Number.isInteger(points) || points < 0) {
                return res.status(400).json({ error: "points must be a non-negative integer" });
            }
            data.points = points;
        }
        
        if (typeof active === "boolean") data.active = active;

        const chore = await prisma.chore.update({
            where: { id },
            data,
        });

        res.json(chore);
    } catch (err) {
        next(err);
    }
});