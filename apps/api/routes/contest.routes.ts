import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/isAdmin.middleware";
import {
  createContest,
  updateContest,
  deleteContest,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  addChallengeToContest,
  removeChallengeFromContest,
  listContests,
  getContest,
  listChallenges,
  listPracticeContests,
} from "../controllers/contest.controller";

const router = Router();

// Public 
router.get("/", authenticate, listContests);
router.get("/practice", authenticate, listPracticeContests);
router.get("/:id", authenticate, getContest);


// Admin
router.get("/admin/challenges", authenticate, isAdmin, listChallenges);

router.post("/admin", authenticate, isAdmin, createContest);
router.put("/admin/:id", authenticate, isAdmin, updateContest);
router.delete("/admin/:id", authenticate, isAdmin, deleteContest);

router.post("/admin/challenges", authenticate, isAdmin, createChallenge);
router.put("/admin/challenges/:id", authenticate, isAdmin, updateChallenge);
router.delete("/admin/challenges/:id", authenticate, isAdmin, deleteChallenge);

router.post("/admin/:contestId/challenges", authenticate, isAdmin, addChallengeToContest);
router.delete("/admin/:contestId/challenges/:challengeId", authenticate, isAdmin, removeChallengeFromContest);

export default router;