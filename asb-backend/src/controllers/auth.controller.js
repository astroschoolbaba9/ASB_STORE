
const { asyncHandler } = require("../utils/asynchandler");
const { registerSchema, loginSchema } = require("../validators/auth.validators");
const { AppError } = require("../utils/AppError");
const { registerWithPassword, loginWithPassword } = require("../services/auth.service");
const { sendOtpSchema, verifyOtpSchema } = require("../validators/otp.validators");
const otpService = require("../services/otp.service");



const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const result = await registerWithPassword(parsed.data);
  res.status(201).json({ success: true, ...result });
});

const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const result = await loginWithPassword(parsed.data);
  res.json({ success: true, ...result });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,          // ✅ important for frontend
      role: req.user.role,
      name: req.user.name || null,
      email: req.user.email || null,
      phone: req.user.phone || null,
      createdAt: req.user.createdAt
    }
  });
});



const sendOtp = asyncHandler(async (req, res) => {
  const parsed = sendOtpSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  await otpService.sendOtp({
    identifier: parsed.data.identifier,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || ""
  });

  // Always return generic success (avoid leaking user existence)
  res.json({ success: true, message: "OTP sent (if identifier is valid)" });
});

const verifyOtp = asyncHandler(async (req, res) => {
console.log("✅ AUTH verifyOtp CONTROLLER HIT:", req.body);

  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const result = await otpService.verifyOtp(parsed.data);
  res.json({ success: true, ...result });
});

module.exports = { register, login, me, sendOtp, verifyOtp };
