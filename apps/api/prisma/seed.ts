// apps/api/prisma/seed.ts
import "dotenv/config";
import { prisma } from "../src/db/prisma.js";
import { UserRole } from "@prisma/client";

async function main() {
  // Clean slate (safe because this is dev seed)
  await prisma.choreCompletion.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.user.deleteMany();

  const [mom, dad, son, daughter] = await Promise.all([
    prisma.user.create({ data: { name: "Mom", role: UserRole.PARENT, active: true } }),
    prisma.user.create({ data: { name: "Dad", role: UserRole.PARENT, active: true } }),
    prisma.user.create({ data: { name: "Son", role: UserRole.KID, active: true } }),
    prisma.user.create({ data: { name: "Daughter", role: UserRole.KID, active: true } }),
  ]);

  const chores = await prisma.chore.createMany({
    data: [
      { title: "Make bed", points: 1, active: true },
      { title: "Put laundry in hamper", points: 1, active: true },
      { title: "Unload dishwasher", points: 3, active: true },
      { title: "Load dishwasher", points: 3, active: true },
      { title: "Take out trash", points: 2, active: true },
      { title: "Feed pets", points: 2, active: true },
      { title: "Vacuum living room", points: 4, active: true },
      { title: "Clean bedroom", points: 5, active: true },
    ],
  });

  const choreList = await prisma.chore.findMany();

  // helper: pick chore by title
  const byTitle = (t: string) => choreList.find((c) => c.title === t)!;

  // Build a few days of completions
  const today = new Date();
  const day = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d;
  };

  await prisma.choreCompletion.createMany({
    data: [
      // two days ago
      { userId: son.id, choreId: byTitle("Make bed").id, completedAt: day(-2) },
      { userId: son.id, choreId: byTitle("Take out trash").id, completedAt: day(-2) },
      { userId: daughter.id, choreId: byTitle("Feed pets").id, completedAt: day(-2) },

      // yesterday
      { userId: daughter.id, choreId: byTitle("Make bed").id, completedAt: day(-1) },
      { userId: daughter.id, choreId: byTitle("Unload dishwasher").id, completedAt: day(-1) },
      { userId: son.id, choreId: byTitle("Load dishwasher").id, completedAt: day(-1) },

      // today
      { userId: son.id, choreId: byTitle("Put laundry in hamper").id, completedAt: day(0) },
      { userId: daughter.id, choreId: byTitle("Clean bedroom").id, completedAt: day(0) },
    ],
  });

  await prisma.reward.createMany({
    data: [
      { title: "30 min extra screen time", costPoints: 10, active: true },
      { title: "Pick dessert", costPoints: 15, active: true },
      { title: "Small toy / Roblox bucks / etc.", costPoints: 30, active: true },
    ],
  });

  const userCount = await prisma.user.count();
  const choreCount = await prisma.chore.count();
  const completionCount = await prisma.choreCompletion.count();
  const rewardCount = await prisma.reward.count();

  console.log({ userCount, choreCount, completionCount, rewardCount });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
