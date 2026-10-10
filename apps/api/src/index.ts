import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db/prisma.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";
import { choresRouter } from "./routes/chores.js";
import { completionsRouter } from "./routes/completions.js";

const app = express();

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(express.json());

// routes
app.use(healthRouter);
app.use(usersRouter);
app.use(choresRouter);
app.use(completionsRouter);

// Optional DB health check (keep this for now)
app.get("/health/db", async (_req, res, next) => {
  try {
    const users = await prisma.user.count();
    res.json({ db: "ok", users });
  } catch (err) {
    next(err);
  }
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  },
);

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);
