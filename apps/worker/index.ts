import { Worker } from "bullmq";
import { createRedisConnection, GRADING_QUEUE, type GradingJobData, restoreLeaderboardFromDb } from "@repo/redis";
import { prisma } from "@repo/db/client";
import { gradeSubmission } from "./grader";

async function bootstrap() {
  console.log("[worker] restoring leaderboards from Postgres...");

  const activeContests = await prisma.contest.findMany({
    where: { endTime: { gte: new Date() } },
    select: { id: true },
  });

  for (const contest of activeContests) {
    const entries = await prisma.leaderboard.findMany({
      where: { contestId: contest.id },
      select: { userId: true, score: true },
    });
    await restoreLeaderboardFromDb(contest.id, entries);
  }

  console.log(`[worker] restored ${activeContests.length} contest leaderboard(s)`);


  const worker = new Worker<GradingJobData>(
    GRADING_QUEUE,
    async (job) => {
      console.log(`Grading submission ${job.data.submissionId}`);
      await gradeSubmission(job.data.submissionId);
    },
    { connection: createRedisConnection(), concurrency: 3 } as any
  );

  worker.on("completed", (job) => console.log(`Graded ${job.id}`));
  worker.on("failed", (job, err) => console.error(`Grading job ${job?.id} failed:`, err));

  process.on("SIGTERM", async () => {
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  console.log("DevForces grading worker started");
}

bootstrap().catch((err) => {
  console.error("[worker] bootstrap failed:", err);
  process.exit(1);
});