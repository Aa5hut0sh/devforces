import type { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/db/client";
import { getLeaderboardSnapshot, getUserRankAndScore } from "@repo/redis";

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contestId } = req.params as { contestId: string };
    const userId = req.userId!;

    const [snapshot, myRank] = await Promise.all([
      getLeaderboardSnapshot(contestId, 50),
      getUserRankAndScore(contestId, userId),
    ]);

    const users = await prisma.user.findMany({
      where: { id: { in: snapshot.map((e) => e.userId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    res.json({
      success: true,
      leaderboard: snapshot.map((e) => ({ ...e, name: nameById.get(e.userId) ?? "Unknown" })),
      me: myRank ? { ...myRank, userId } : null,
    });
  } catch (err) {
    next(err);
  }
};