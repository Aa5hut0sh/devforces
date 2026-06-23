import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { leaderboardService } from "@/services/leaderboard.service";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

type LeaderboardUpdatePayload = {
  contestId: string;
  entries: import("@/lib/types").LeaderboardEntry[];
};

type SubmissionUpdatePayload = {
  submissionId: string;
  status: import("@/lib/types").SubmissionStatus;
  points: number;
  testResults: import("@/lib/types").TestResult[];
};

interface UseSocketOptions {
  onLeaderboardUpdate?: (data: LeaderboardUpdatePayload) => void;
  onSubmissionUpdate?: (data: SubmissionUpdatePayload) => void;
}

export function useSocket(contestId: string | null, options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);

  // keep options ref fresh without re-connecting
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!contestId) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-contest", contestId);  
    });

    socket.on("leaderboard:update", (data: LeaderboardUpdatePayload) => {
      optionsRef.current.onLeaderboardUpdate?.(data);
    });

    socket.on("submission:update", (data: SubmissionUpdatePayload) => {
      optionsRef.current.onSubmissionUpdate?.(data);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect error:", err.message);
    });

    return () => {
      socket.emit("leave-contest", contestId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [contestId]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit, socket: socketRef.current };
}