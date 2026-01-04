import "dotenv/config";
import express from "express";
import cors from "cors";

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

// SQLite DB file location (relative to apps/api)
const sqlite = new Database("dev.db");

// Prisma 7 uses an adapter for direct DB connections
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const app = express();

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// Create a user
app.post("/api/users", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  const user = await prisma.user.create({ data: { name } });
  res.json(user);
});

// List users
app.get("/api/users", async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json(users);
});

// Create a chore
app.post("/api/chores", async (req, res) => {
  const title = String(req.body?.title ?? "").trim();
  const points = Number(req.body?.points ?? 1);

  if (!title) return res.status(400).json({ error: "title is required" });
  if (!Number.isFinite(points) || points < 1)
    return res.status(400).json({ error: "points must be >= 1" });

  const chore = await prisma.chore.create({
    data: { title, points },
  });

  res.json(chore);
});

// List chores
app.get("/api/chores", async (_req, res) => {
  const chores = await prisma.chore.findMany({ orderBy: { createdAt: "asc" } });
  res.json(chores);
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
