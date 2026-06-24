import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma, SubmissionStatus } from "@repo/db/client";
import { getGradingQueue } from "@repo/redis";
import { getCurrentMapping, buildAccumulatedFiles } from "../utils/progress";

const submitSchema = z.object({
  files: z.record(z.string(), z.string()),
});

export const submitChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contestId } = req.params as { contestId: string };
    const userId = req.userId!;

    const parse = submitSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const currentMapping = await getCurrentMapping(contestId, userId);
    if (!currentMapping) {
      return res.status(400).json({ success: false, message: "No active challenge for this contest" });
    }

    const editableFiles = currentMapping.challenge.editableFiles as string[];
    const submittedPaths = Object.keys(parse.data.files);

    const invalid = submittedPaths.filter((p) => !editableFiles.includes(p));
    if (invalid.length) {
      return res.status(400).json({ success: false, message: `Not editable: ${invalid.join(", ")}` });
    }
    const missing = editableFiles.filter((p) => !submittedPaths.includes(p));
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing files: ${missing.join(", ")}` });
    }


    const accumulated = await buildAccumulatedFiles(contestId, userId);
    const fullFiles = { ...accumulated, ...parse.data.files };

    const submission = await prisma.submission.create({
      data: {
        files: parse.data.files,
        fullFiles,
        userId,
        contestToChallengeMappingId: currentMapping.id,
        status: SubmissionStatus.PENDING,
      },
    });

    await getGradingQueue().add("grade", { submissionId: submission.id });

    res.status(202).json({ success: true, submissionId: submission.id, status: "PENDING" });
  } catch (err) {
    next(err);
  }
};

export const getProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contestId } = req.params as { contestId: string };
    const userId = req.userId!;

    const currentMapping = await getCurrentMapping(contestId, userId);
    const files = await buildAccumulatedFiles(contestId, userId);

    if (!currentMapping) {
      return res.json({ success: true, completed: true, files });
    }

    res.json({
      success: true,
      completed: false,
      currentChallenge: {
        id: currentMapping.challenge.id,
        title: currentMapping.challenge.title,
        notionDocId: currentMapping.challenge.notionDocId,
        maxPoints: currentMapping.challenge.maxPoints,
        editableFiles: currentMapping.challenge.editableFiles,
        index: currentMapping.index,
      },
      files,
    });
  } catch (err) {
    next(err);
  }
};

export const getSubmissionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.userId!;

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: { id: true, status: true, points: true, testResults: true, userId: true, createdAt: true, gradedAt: true },
    });

    if (!submission || submission.userId !== userId) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
};

export const getMySubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contestId } = req.params as { contestId: string };
    const userId = req.userId!;

    const currentMapping = await getCurrentMapping(contestId, userId);
    if (!currentMapping) {
      return res.json({ success: true, submissions: [] });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        contestToChallengeMappingId: currentMapping.id,
      },
      select: {
        id: true,
        status: true,
        points: true,
        testResults: true,
        createdAt: true,
        gradedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20, // last 20 attempts
    });

    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
};