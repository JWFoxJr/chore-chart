/*
  Warnings:

  - Added the required column `pointsAwarded` to the `ChoreCompletion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChoreCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "ChoreCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChoreCompletion_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChoreCompletion"
    ("choreId", "completedAt", "createdAt", "id", "notes", "userId", "pointsAwarded")
SELECT
    cc."choreId",
    cc."completedAt",
    cc."createdAt",
    cc."id",
    cc."notes",
    cc."userId",
    (SELECT c."points" FROM "Chore" AS c WHERE c."id" = cc."choreId")
FROM "ChoreCompletion" AS cc;
DROP TABLE "ChoreCompletion";
ALTER TABLE "new_ChoreCompletion" RENAME TO "ChoreCompletion";
CREATE INDEX "ChoreCompletion_completedAt_idx" ON "ChoreCompletion"("completedAt");
CREATE INDEX "ChoreCompletion_userId_completedAt_idx" ON "ChoreCompletion"("userId", "completedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
