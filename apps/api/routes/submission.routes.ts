import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { submitChallenge, getProgress, getSubmissionStatus, getMySubmissions } from "../controllers/submission.controller";
import { submissionRateLimit } from "../middleware/rateLimit.middleware";

const router = Router();

router.get("/:contestId/progress", authenticate, getProgress);
router.post("/:contestId/submit", authenticate, submissionRateLimit(30), submitChallenge);
router.get("/:contestId/history", authenticate, getMySubmissions);
router.get("/status/:id", authenticate, getSubmissionStatus);

export default router;