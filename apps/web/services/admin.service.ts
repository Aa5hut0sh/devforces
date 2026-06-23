import api from "@/lib/api";
import type {
  AdminContest,
  AdminChallenge,
  CreateContestPayload,
  UpdateContestPayload,
  CreateChallengePayload,
  UpdateChallengePayload,
  MapChallengePayload,
} from "@/lib/types";

export const adminService = {

  async createContest(payload: CreateContestPayload): Promise<AdminContest> {
    const { data } = await api.post<{ success: boolean; contest: AdminContest }>(
      "/contests/admin",
      payload
    );
    return data.contest;
  },

  async updateContest(contestId: string, payload: UpdateContestPayload): Promise<AdminContest> {
    const { data } = await api.put<{ success: boolean; contest: AdminContest }>(
      `/contests/admin/${contestId}`,
      payload
    );
    return data.contest;
  },

  async deleteContest(contestId: string): Promise<void> {
    await api.delete(`/contests/admin/${contestId}`);
  },

  async createChallenge(payload: CreateChallengePayload): Promise<AdminChallenge> {
    const { data } = await api.post<{ success: boolean; challenge: AdminChallenge }>(
      "/contests/admin/challenges",
      payload
    );
    return data.challenge;
  },

  async updateChallenge(challengeId: string, payload: UpdateChallengePayload): Promise<AdminChallenge> {
    const { data } = await api.put<{ success: boolean; challenge: AdminChallenge }>(
      `/contests/admin/challenges/${challengeId}`,
      payload
    );
    return data.challenge;
  },

  async deleteChallenge(challengeId: string): Promise<void> {
    await api.delete(`/contests/admin/challenges/${challengeId}`);
  },


  async addChallengeToContest(contestId: string, payload: MapChallengePayload): Promise<void> {
    await api.post(`/contests/admin/${contestId}/challenges`, payload);
  },

  async removeChallengeFromContest(contestId: string, challengeId: string): Promise<void> {
    await api.delete(`/contests/admin/${contestId}/challenges/${challengeId}`);
  },
};