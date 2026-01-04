import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Prisma v7 requires either:
 * - an adapter (driver adapters), or
 * - accelerateUrl
 *
 * For local SQLite, use the BetterSqlite3 driver adapter.
 */
const url = process.env.DATABASE_URL ?? "file:./dev.db";

export const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});
