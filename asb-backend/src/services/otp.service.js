const crypto = require("crypto");
const User = require("../models/User");
const OtpRequest = require("../models/OtpRequest");

const { AppError } = require("../utils/AppError");
const { generateOtp } = require("../utils/otp");
const { signAccessToken } = require("../utils/jwt");
const { env } = require("../config/env");

console.log("✅ OTP SERVICE LOADED (Mongo-backed)");

const ADMIN_PHONE = "9911500291"; // 🔐 ONLY THIS NUMBER IS ADMIN

function normalizeIdentifier(identifier) {
  let v = String(identifier || "").trim();
  v = v.replace(/\s+/g, "");

  if (v.includes("@")) return { identifier: v.toLowerCase(), channel: "email" };

  v = v.replace(/\D/g, "");
  if (v.length > 10) v = v.slice(-10);
  return { identifier: v, channel: "phone" };
}

function userDto(user) {
  return {
    _id: user._id,
    role: user.role,
    name: user.name || null,
    email: user.email || null,
    phone: user.phone || null,
  };
}

function hashOtp(rawOtp) {
  const secret = String(env.OTP_HASH_SECRET || "dev_otp_secret_change_me");
  return crypto.createHmac("sha256", secret).update(String(rawOtp)).digest("hex");
}

async function sendOtp({ identifier }) {
  const norm = normalizeIdentifier(identifier);

  const ttl = Number(env.OTP_TTL_SECONDS || 600);
  const otp = String(generateOtp());
  const expiresAt = new Date(Date.now() + ttl * 1000);
  const otpHash = hashOtp(otp);

  await OtpRequest.updateOne(
    { identifier: norm.identifier, channel: norm.channel },
    { $set: { otpHash, expiresAt, attempts: 0, consumedAt: null } },
    { upsert: true }
  );

  console.log(`📩 DEV OTP for ${norm.identifier} (${norm.channel}): ${otp}`);
  return { success: true };
}

async function verifyOtp({ identifier, otp, code }) {
  const provided = otp ?? code;
  const norm = normalizeIdentifier(identifier);

  const doc = await OtpRequest.findOne({ identifier: norm.identifier, channel: norm.channel });
  if (!doc) throw new AppError("OTP expired", 400, "OTP_EXPIRED");

  if (doc.consumedAt) throw new AppError("OTP already used", 400, "OTP_USED");
  if (Date.now() > doc.expiresAt.getTime()) {
    await OtpRequest.deleteOne({ _id: doc._id });
    throw new AppError("OTP expired", 400, "OTP_EXPIRED");
  }

  doc.attempts += 1;
  if (doc.attempts > 5) {
    await OtpRequest.deleteOne({ _id: doc._id });
    throw new AppError("Too many attempts", 429, "OTP_LIMIT");
  }

  if (hashOtp(String(provided || "")) !== doc.otpHash) {
    await doc.save();
    throw new AppError("Invalid OTP", 400, "OTP_INVALID");
  }

  await OtpRequest.deleteOne({ _id: doc._id });

  const findQuery =
    norm.channel === "email"
      ? { email: norm.identifier }
      : { phone: norm.identifier };

  const phoneStr = norm.channel === "phone" ? norm.identifier : "";

  // ✅ LOWERCASE ONLY (matches User schema)
  const role = phoneStr === ADMIN_PHONE ? "admin" : "user";

  const setUpdate = { role };
  if (norm.channel === "email") setUpdate.email = norm.identifier;
  if (norm.channel === "phone") setUpdate.phone = norm.identifier;

  const user = await User.findOneAndUpdate(
    findQuery,
    { $set: setUpdate },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // 🚫 HARD SAFETY: downgrade anyone else
  if (user.phone !== ADMIN_PHONE && user.role === "admin") {
    user.role = "user";
    await user.save();
  }

  if (user.isBlocked) throw new AppError("User blocked", 403, "BLOCKED");

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role, // lowercase is fine
  });

  return { accessToken, user: userDto(user), mode: "OTP_LOGIN_OR_REGISTER" };
}

module.exports = { sendOtp, verifyOtp };
