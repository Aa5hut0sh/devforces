import { createRedisConnection } from "./client";


const redis = createRedisConnection();

export const leaderboardKey = (contestId: string) => `lb:contest:${contestId}`;

export async function incrementLeaderboardScore(contestId: string, userId: string, pointsDelta: number) {
  return redis.zincrby(leaderboardKey(contestId), pointsDelta, userId);
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
}

export async function getLeaderboardSnapshot(contestId: string, limit = 50): Promise<LeaderboardEntry[]> {
  const raw = await redis.zrevrange(leaderboardKey(contestId), 0, limit - 1, "WITHSCORES");
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({ userId: raw[i]!, score: Number(raw[i + 1]), rank: i / 2 + 1 });
  }
  return entries;
}

export async function getUserRankAndScore(contestId: string, userId: string) {
  const [rank, score] = await Promise.all([
    redis.zrevrank(leaderboardKey(contestId), userId),
    redis.zscore(leaderboardKey(contestId), userId),
  ]);
  if (rank === null || score === null) return null;
  return { rank: rank + 1, score: Number(score) };
}

export async function restoreLeaderboardFromDb(
  contestId: string,
  entries: Array<{ userId: string; score: number }>
): Promise<void> {
  if (entries.length === 0) return;

  const key = leaderboardKey(contestId);

  // delete stale sorted set first
  await redis.del(key);

  // rebuild in one pipeline
  const pipeline = redis.pipeline();
  for (const e of entries) {
    pipeline.zadd(key, e.score, e.userId);
  }
  await pipeline.exec();

  console.log(`[redis] restored leaderboard:${contestId} with ${entries.length} entries`);
}