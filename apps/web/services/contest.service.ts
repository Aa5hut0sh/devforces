import api from "@/lib/api";
import type { Contest } from "@/lib/types";

export const contestService = {
  async list(): Promise<Contest[]> {
    const { data } = await api.get<{ success: boolean; contests: Contest[] }>(
      "/contests",
    );
    return data.contests;
  },

  async get(contestId: string): Promise<Contest> {
    const { data } = await api.get<{ success: boolean; contest: Contest }>(
      `/contests/${contestId}`,
    );
    return data.contest;
  },

  async listPractice(): Promise<Contest[]> {
    const { data } = await api.get<{ success: boolean; contests: Contest[] }>("/contests/practice");
    return data.contests;
  },
};
