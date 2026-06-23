import {Router} from "express";
import {login , registerUser , registerAdmin , googleLoginHandler , getCurrentUser} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();


router.post("/login" , login);
router.post("/register" , registerUser);
router.post("/register-admin" , registerAdmin);
router.post("/google-login" , googleLoginHandler);
router.get("/me",authenticate , getCurrentUser);


export default router;