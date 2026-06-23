import type { ChildProcess } from "child_process";
import { prisma, SubmissionStatus } from "@repo/db/client";
import {
  incrementLeaderboardScore,
  publishLeaderboardUpdate,
  getLeaderboardSnapshot,
} from "@repo/redis";
import { prepareSubmissionDir, cleanupSubmissionDir } from "./prepareDir";
import { getFreePortAndRelease, spawnSandboxed, waitForReady } from "./spawn";
import { runTestSpec, type TestCase } from "./testRunner";
import { toJsonValue } from "./toJson";
import fs from "fs/promises";

function killProcess(proc: ChildProcess) {
  try {
    proc.kill("SIGKILL");
  } catch {}
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Grading timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function gradeSubmission(submissionId: string) {
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: submissionId },
    include: {
      contestToChallengeMapping: {
        include: { challenge: true, contest: true },
      },
    },
  });

  const { challenge, contest } = submission.contestToChallengeMapping;

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: SubmissionStatus.RUNNING },
  });

  let tmpDir: string | null = null;
  let child: ChildProcess | null = null;

  try {
    const result = await withTimeout(
      (async () => {
        tmpDir = await prepareSubmissionDir(
          contest.boilerplateId,
          submission.fullFiles as Record<string, string>,
        );

        const { port, release } = await getFreePortAndRelease();
        child = spawnSandboxed(tmpDir, port);
        release();

        // attach BEFORE waitForReady so crash output is visible
        child.stderr?.on("data", (d) =>
          console.error("[child err]", d.toString().trim()),
        );
        child.stdout?.on("data", (d) =>
          console.log("[child out]", d.toString().trim()),
        );

        await waitForReady(port);

        return runTestSpec(
          `http://127.0.0.1:${port}`,
          challenge.testSpec as unknown as TestCase[],
        );
      })(),
      // separate ceiling: startup (15s) + test run time
      challenge.timeLimitSeconds * 1000 + 20_000,
    );

    const status = result.allPassed
      ? SubmissionStatus.PASSED
      : SubmissionStatus.FAILED;

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        points: result.totalPoints,
        testResults: toJsonValue(result.results),
        gradedAt: new Date(),
      },
    });

    if (status === SubmissionStatus.PASSED) {
      await incrementLeaderboardScore(
        contest.id,
        submission.userId,
        result.totalPoints,
      );
      const snapshot = await getLeaderboardSnapshot(contest.id);
      await publishLeaderboardUpdate(contest.id, snapshot);
    }
  } catch (err) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.ERROR,
        testResults: {
          error: err instanceof Error ? err.message : "Unknown grading error",
        },
        gradedAt: new Date(),
      },
    });
  } finally {
    if (child) killProcess(child);
    if (tmpDir) await cleanupSubmissionDir(tmpDir);
  }
}
