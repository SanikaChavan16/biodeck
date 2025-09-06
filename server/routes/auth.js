// server/routes/auth.js
import express from "express";
import { signup, verifyEmail, login, resendVerification } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js"; // ✅ import your middleware

const router = express.Router();

// GET /api/auth/me → return current user (only if logged in)
router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      companyId: req.user.companyId,
      role: req.user.role,
    },
  });
});

// other routes
router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/resend-verification", resendVerification);

export default router;
