import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

healthRouter.get("/health/db", async (_req, res, next) => {
  try {
    const users = await prisma.user.count();
    res.json({ db: "ok", users });
  } catch (err) {
    next(err);
  }
});
