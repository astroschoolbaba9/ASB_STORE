// backend/services/auth.service.js
const User = require("../models/User");
const { AppError } = require("../utils/AppError");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signAccessToken } = require("../utils/jwt");

function normalizeIdentifier(identifier) {
  const v = String(identifier || "").trim();
  if (v.includes("@")) return { email: v.toLowerCase() };
  return { phone: v };
}

function userDto(user) {
  return {
    _id: user._id, // ✅ use _id everywhere
    role: user.role,
    name: user.name || null,
    email: user.email || null,
    phone: user.phone || null,
  };
}

async function registerWithPassword({ name, email, phone, password }) {
  const doc = {
    name: name?.trim(),
    email: email ? email.toLowerCase() : undefined,
    phone: phone?.trim(),
    passwordHash: await hashPassword(password),
  };

  if (doc.email) {
    const exists = await User.findOne({ email: doc.email });
    if (exists) throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
  }
  if (doc.phone) {
    const exists = await User.findOne({ phone: doc.phone });
    if (exists) throw new AppError("Phone already registered", 409, "PHONE_EXISTS");
  }

  const user = await User.create(doc);

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

  return { accessToken, user: userDto(user) };
}

async function loginWithPassword({ identifier, password }) {
  const q = normalizeIdentifier(identifier);

  const user = await User.findOne(q);
  if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  if (user.isBlocked) throw new AppError("User is blocked", 403, "FORBIDDEN");
  if (!user.passwordHash) throw new AppError("Password login not available for this account", 400, "PASSWORD_NOT_SET");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

  return { accessToken, user: userDto(user) };
}

module.exports = { registerWithPassword, loginWithPassword };
