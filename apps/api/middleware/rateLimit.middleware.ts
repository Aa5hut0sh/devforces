
import { type Request, type Response, type NextFunction } from "express";
import { createRedisConnection } from "@repo/redis";

const redis = createRedisConnection();

export function submissionRateLimit(windowSec = 30) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:submit:${req.userId}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
    if (count > 1) {
      return res.status(429).json({
        success: false,
        message: `Wait ${windowSec} seconds between submissions.`,
      });
    }
    next();
  };
}