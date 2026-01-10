import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { UserRole } from "@prisma/client";

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (Object.values(UserRole) as string[]).includes(value);

export const usersRouter = Router();

usersRouter.get("/users", async (_req, res, next) => {
    try {
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
        res.json(users);
    } catch (err) {
        next(err);
    }
});

usersRouter.post("/users", async (req, res, next) => {
  try {
    const { name, role } = req.body as { name?: unknown; role?: unknown };

    if (typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        role: isUserRole(role) ? role : UserRole.KID, // default
      },
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});


usersRouter.patch("/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, active } = req.body as {
      name?: unknown;
      role?: unknown;
      active?: unknown;
    };

    const data: { name?: string; role?: UserRole; active?: boolean } = {};

    if (typeof name === "string") data.name = name.trim();
    if (isUserRole(role)) data.role = role;
    if (typeof active === "boolean") data.active = active;

    const user = await prisma.user.update({ where: { id }, data });
    res.json(user);
  } catch (err) {
    next(err);
  }
});
