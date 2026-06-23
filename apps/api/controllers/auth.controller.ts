import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import z from "zod";
import { prisma, Role } from "@repo/db/client";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
const TOKEN_EXPIRY = "7d";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const adminRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  adminSecret: z.string().min(1, "Admin secret is required"),
});

function signToken(userId: string, role: Role) {
  return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function stripPassword<T extends { password: string }>(user: T) {
  const { password, ...rest } = user;
  return rest;
}

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        message: parse.error.issues.map((e) => e.message).join(", "),
      });
    }

    const { name, email, password } = parse.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: Role.User },
    });

    const token = signToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: stripPassword(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = adminRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const { email, password, name, adminSecret } = parse.data;

    if (adminSecret !== env.ADMIN_SECRET) {
      return res.status(403).json({ success: false, message: "Invalid admin secret" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: Role.Admin },
    });

    const token = signToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      user: stripPassword(user),
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.issues });
    }

    const { email, password } = parse.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const token = signToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: stripPassword(user),
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const googleLoginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: "Invalid Google token" });
    }

    const { email, name } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword =
        Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: { name: name || "Google User", email, password: hashedPassword, role: Role.User },
      });
    }

    const token = signToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      user: stripPassword(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};