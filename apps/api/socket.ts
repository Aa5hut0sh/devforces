import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config/env";
import { subscribeToAllLeaderboards } from "@repo/redis";

export function initSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.WEB_ORIGIN || "*" },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-contest", (contestId: string) => socket.join(`contest:${contestId}`));
    socket.on("leave-contest", (contestId: string) => socket.leave(`contest:${contestId}`));
  });

  subscribeToAllLeaderboards((contestId, payload) => {
    io.to(`contest:${contestId}`).emit("leaderboard:update", payload);
  });

  return io;
}