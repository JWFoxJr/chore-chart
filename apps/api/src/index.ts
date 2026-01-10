import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db/prisma.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";

const app = express();

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(express.json());

// routes
app.use(healthRouter);
app.use(usersRouter);

app.get("/health/db", async (_req, res, next) => {
  try {
    const users = await prisma.user.count();
    res.json({ db: "ok", users });
  } catch (err) {
    next(err);
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const port= process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});
