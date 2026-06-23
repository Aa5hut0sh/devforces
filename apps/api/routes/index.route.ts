import {Router} from "express";
import authRoute from "./auth.route"
import contestRouter from "./contest.routes"
import submissionRouter from "./submission.routes"
import leaderboardRouter from "./leaderboard.route"
const router = Router();


router.use("/auth",authRoute);
router.use("/contests", contestRouter);
router.use("/submissions", submissionRouter);
router.use("/leaderboard", leaderboardRouter)


export default router;