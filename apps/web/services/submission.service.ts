import api from "@/lib/api";
import type {
  Progress,
  SubmitPayload,
  SubmitResponse,
  SubmissionStatusResponse,
  TestResult,
  SubmissionStatus,
} from "@/lib/types";

export const submissionService = {
  async submit(
    contestId: string,
    payload: SubmitPayload,
  ): Promise<SubmitResponse> {
    const { data } = await api.post<SubmitResponse>(
      `/submissions/${contestId}/submit`,
      payload,
    );
    return data;
  },

  async getStatus(submissionId: string): Promise<SubmissionStatusResponse> {
    const { data } = await api.get<{
      success: boolean;
      submission: SubmissionStatusResponse;
    }>(`/submissions/status/${submissionId}`);
    return data.submission;
  },

  async getProgress(contestId: string): Promise<Progress> {
    const { data } = await api.get<{ success: boolean } & Progress>(
      `/submissions/${contestId}/progress`,
    );
    const { success, ...progress } = data;
    return progress;
  },

  async getHistory(contestId: string): Promise<{
    id: string;
    status: SubmissionStatus;
    points: number;
    testResults: TestResult[] | null;
    createdAt: string;
    gradedAt: string | null;
  }[]> {
    const { data } = await api.get<{
      success: boolean;
      submissions: {
        id: string;
        status: SubmissionStatus;
        points: number;
        testResults: TestResult[] | null;
        createdAt: string;
        gradedAt: string | null;
      }[];
    }>(`/submissions/${contestId}/history`);
    return data.submissions;
  },

  async pollUntilDone(
    submissionId: string,
    options: { intervalMs?: number; timeoutMs?: number } = {},
  ): Promise<SubmissionStatusResponse> {
    const { intervalMs = 1500, timeoutMs = 60000 } = options;
    const deadline = Date.now() + timeoutMs;

    return new Promise((resolve, reject) => {
      const tick = async () => {
        try {
          const result = await submissionService.getStatus(submissionId);
          const done = ["PASSED", "FAILED", "ERROR"].includes(result.status);

          if (done) return resolve(result);
          if (Date.now() >= deadline)
            return reject(new Error("Polling timed out"));

          setTimeout(tick, intervalMs);
        } catch (err) {
          reject(err);
        }
      };
      tick();
    });
  },
};
