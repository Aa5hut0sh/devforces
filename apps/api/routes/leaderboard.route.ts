import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getLeaderboard } from "../controllers/leaderboard.controller";

const router = Router();
router.get("/:contestId", authenticate, getLeaderboard);
export default router;