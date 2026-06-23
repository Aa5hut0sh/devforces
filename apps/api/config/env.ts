
import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 characters"),
  ADMIN_SECRET: z.string().min(1, "ADMIN_SECRET is required"),
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);