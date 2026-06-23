import type { Request, Response } from "express";
import { prisma } from "@repo/db/client";


export const checkHealth = async (req: Request, res: Response) => {
  const healthStatus = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      api: "UP",
      database: "DOWN",
      redis: "DOWN",
    },
  };

  let isHealthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = "UP";
  } catch (error) {
    healthStatus.services.database = "DOWN";
    isHealthy = false;
    console.error("HealthCheck: Database down", error);
  }


  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(healthStatus);
};