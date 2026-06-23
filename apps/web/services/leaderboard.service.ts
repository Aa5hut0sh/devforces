import api from "@/lib/api";
import type { Leaderboard , LeaderboardEntry, LeaderboardResponse } from "@/lib/types";

export const leaderboardService = {
  async get(contestId: string): Promise<LeaderboardResponse> {
    const { data } = await api.get<{
      success: boolean;
      leaderboard: LeaderboardEntry[];
      me: { rank: number; score: number; userId: string } | null;
    }>(`/leaderboard/${contestId}`);
    return data;
  },
};
