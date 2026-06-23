import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { submitChallenge, getProgress, getSubmissionStatus } from "../controllers/submission.controller";

const router = Router();

router.get("/:contestId/progress", authenticate, getProgress);
router.post("/:contestId/submit", authenticate, submitChallenge);
router.get("/status/:id", authenticate, getSubmissionStatus);

export default router;