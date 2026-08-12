const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// ✅ PUBLIC auth routes (NO requireAdmin, NO requireAuth)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

// ✅ Push Token Registration (Guest or Logged In User)
router.post("/push-token", optionalAuth, authController.savePushToken);

// ✅ protected
router.get("/me", requireAuth, authController.me);

router.use((req, res, next) => {
  console.log("✅ AUTH ROUTES HIT:", req.method, req.originalUrl);
  next();
});

module.exports = router;

