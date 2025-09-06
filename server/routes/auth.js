// server/routes/auth.js
import express from "express";
import { signup, verifyEmail, login, resendVerification } from "../controllers/authController.js";
const router = express.Router();

router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/resend-verification", resendVerification);

export default router;
