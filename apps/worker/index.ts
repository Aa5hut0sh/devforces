import { Worker } from "bullmq";
import { createRedisConnection, GRADING_QUEUE, type GradingJobData } from "@repo/redis";
import { gradeSubmission } from "./grader";

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
  process.exit(0);
});

console.log("DevForces grading worker started");