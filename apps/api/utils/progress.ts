import { prisma, SubmissionStatus } from "@repo/db/client";
import { loadBoilerplateFiles } from "./boilerplate";

export async function getCurrentMapping(contestId: string, userId: string) {
  const mappings = await prisma.contestToChallengeMapping.findMany({
    where: { contestId },
    orderBy: { index: "asc" },
    include: { challenge: true },
  });
  if (mappings.length === 0) return null;

  const passed = await prisma.submission.findMany({
    where: {
      userId,
      status: SubmissionStatus.PASSED,
      contestToChallengeMapping: { contestId },
    },
    select: { contestToChallengeMappingId: true },
  });
  const passedIds = new Set(passed.map((s) => s.contestToChallengeMappingId));

  return mappings.find((m) => !passedIds.has(m.id)) ?? null; // null = contest fully completed
}

export async function buildAccumulatedFiles(contestId: string, userId: string) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if(!contest) throw new Error(`Contest ${contestId} not found`);
  const files = await loadBoilerplateFiles(contest.boilerplateId);

  const passedSubmissions = await prisma.submission.findMany({
    where: { userId, status: SubmissionStatus.PASSED, contestToChallengeMapping: { contestId } },
    include: { contestToChallengeMapping: true },
    orderBy: { contestToChallengeMapping: { index: "asc" } },
  });

  for (const s of passedSubmissions) {
    Object.assign(files, s.files as Record<string, string>);
  }
  return files; 
}