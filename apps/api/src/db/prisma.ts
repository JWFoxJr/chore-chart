import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set. Create apps/api/.env (see .env.example).");
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
