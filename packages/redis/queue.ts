import { Queue } from "bullmq";
import { createRedisConnection } from "./client";

export const GRADING_QUEUE = "grading";

export interface GradingJobData {
  submissionId: string;
}

type GradingQueue = Queue<GradingJobData>;

let queue: GradingQueue | null = null;

export function getGradingQueue(): GradingQueue {
  if (!queue) {
    queue = new Queue<GradingJobData>(GRADING_QUEUE, {
      connection: createRedisConnection() as any,
    }) as GradingQueue;
  }
  return queue; 
}