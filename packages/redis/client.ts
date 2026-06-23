import Redis, { type RedisOptions } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
};

export function createRedisConnection(): Redis {
  const client = new Redis(REDIS_URL, baseOptions);

  client.on("error", (err) => {
    console.error("Redis client error:", err);
  });

  return client;
}