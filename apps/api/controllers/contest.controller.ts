import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@repo/db/client";

const createContestSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    boilerplateId: z.string().min(1),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    mode: z.enum(["CONTEST", "PRACTICE"]).optional().default("CONTEST"),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

const updateContestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  boilerplateId: z.string().min(1).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  mode: z.enum(["CONTEST", "PRACTICE"]).optional(),
});

const testCaseSchema = z.object({
  name: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
  expect: z.object({
    status: z.number().int(),
    jsonSchema: z.any().optional(),
  }),
  weight: z.number().int().positive(),
  saveAs: z.record(z.string(), z.string()).optional(),
});

const createChallengeSchema = z.object({
  title: z.string().min(1),
  notionDocId: z.string().min(1),
  maxPoints: z.number().int().positive(),
  editableFiles: z.array(z.string().min(1)).min(1),
  testSpec: z.array(testCaseSchema).min(1),
  timeLimitSeconds: z.number().int().positive().default(15),
});

const updateChallengeSchema = createChallengeSchema.partial();

const mapChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  index: z.number().int().nonnegative(),
});

// ---------- Admin: Contest ----------

export const createContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = createContestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const contest = await prisma.contest.create({ data: parse.data });
    res.status(201).json({ success: true, contest });
  } catch (err) {
    next(err);
  }
};

export const updateContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const parse = updateContestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const contest = await prisma.contest.update({ where: { id }, data: parse.data });
    res.json({ success: true, contest });
  } catch (err) {
    next(err);
  }
};

export const deleteContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.contest.delete({ where: { id } });
    res.json({ success: true, message: "Contest deleted" });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin: Challenge ----------

export const createChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = createChallengeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const challenge = await prisma.challenge.create({ data: parse.data });
    res.status(201).json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
};

export const updateChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const parse = updateChallengeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const challenge = await prisma.challenge.update({ where: { id }, data: parse.data });
    res.json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
};

export const deleteChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.challenge.delete({ where: { id } });
    res.json({ success: true, message: "Challenge deleted" });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin: Contest <-> Challenge mapping ----------

export const addChallengeToContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contestId } = req.params as { contestId: string };
    const parse = mapChallengeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const mapping = await prisma.contestToChallengeMapping.create({
      data: { contestId, challengeId: parse.data.challengeId, index: parse.data.index },
    });
    res.status(201).json({ success: true, mapping });
  } catch (err) {
    next(err);
  }
};

export const removeChallengeFromContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contestId, challengeId } = req.params as { contestId: string; challengeId: string };
    await prisma.contestToChallengeMapping.delete({
      where: { contestId_challengeId: { contestId, challengeId } },
    });
    res.json({ success: true, message: "Challenge removed from contest" });
  } catch (err) {
    next(err);
  }
};

// ---------- Public ----------

export const listContests = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const contests = await prisma.contest.findMany({
      where: { mode: "CONTEST" },
      select: { id: true, title: true, description: true, startTime: true, endTime: true },
      orderBy: { startTime: "desc" },
    });

    const now = new Date();
    const withStatus = contests.map((c) => ({
      ...c,
      status: now < c.startTime ? "UPCOMING" : now > c.endTime ? "ENDED" : "LIVE",
    }));

    res.json({ success: true, contests: withStatus });
  } catch (err) {
    next(err);
  }
};

export const getContest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const contest = await prisma.contest.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        mode: true,
        contestToChallengeMapping: {
          orderBy: { index: "asc" },
          select: {
            index: true,
            challenge: {
              select: {
                id: true,
                title: true,
                maxPoints: true,
                editableFiles: true,
                // testSpec intentionally excluded — never sent to the client
              },
            },
          },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    res.json({ success: true, contest });
  } catch (err) {
    next(err);
  }
};

export const listChallenges = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, notionDocId: true, maxPoints: true,
        editableFiles: true, testSpec: true, timeLimitSeconds: true, createdAt: true,
      },
    });
    res.json({ success: true, challenges });
  } catch (err) { next(err); }
};


export const listPracticeContests = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const contests = await prisma.contest.findMany({
      where: { mode: "PRACTICE" },
      select: { id: true, title: true, description: true, startTime: true, endTime: true, mode: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      contests: contests.map((c) => ({ ...c, status: "PRACTICE" })),
    });
  } catch (err) {
    next(err);
  }
};