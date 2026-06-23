import type{ Request, Response, NextFunction } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "Admin") {
    return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
    });
    }
    next();
}