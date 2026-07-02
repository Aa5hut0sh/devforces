import type { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/db/client";
import { getLeaderboardSnapshot, getUserRankAndScore, incrementLeaderboardScore } from "@repo/redis";

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contestId } = req.params as { contestId: string };
    const userId = req.userId!;

    let snapshot = await getLeaderboardSnapshot(contestId, 50);

    if (snapshot.length === 0) {
      const dbEntries = await prisma.leaderboard.findMany({
        where: { contestId },
        orderBy: { score: "desc" },
        take: 50,
        include: { user: { select: { id: true, name: true } } },
      });

      if (dbEntries.length > 0) {
        await Promise.all(
          dbEntries.map((e) =>
            incrementLeaderboardScore(contestId, e.userId, e.score)
          )
        );
        snapshot = await getLeaderboardSnapshot(contestId, 50);
      }

      return res.json({
        success: true,
        leaderboard: dbEntries.map((e, i) => ({
          userId: e.userId,
          score: e.score,
          rank: i + 1,
          name: e.user.name,
        })),
        me: dbEntries.find((e) => e.userId === userId)
          ? {
              rank: dbEntries.findIndex((e) => e.userId === userId) + 1,
              score: dbEntries.find((e) => e.userId === userId)!.score,
              userId,
            }
          : null,
      });
    }

    const [myRank, users] = await Promise.all([
      getUserRankAndScore(contestId, userId),
      prisma.user.findMany({
        where: { id: { in: snapshot.map((e) => e.userId) } },
        select: { id: true, name: true },
      }),
    ]);

    const nameById = new Map(users.map((u) => [u.id, u.name]));

    res.json({
      success: true,
      leaderboard: snapshot.map((e) => ({
        ...e,
        name: nameById.get(e.userId) ?? "Unknown",
      })),
      me: myRank ? { ...myRank, userId } : null,
    });
  } catch (err) {
    next(err);
  }
};