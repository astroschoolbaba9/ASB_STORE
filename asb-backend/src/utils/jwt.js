// backend/utils/jwt.js
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signAccessToken({ sub, role }) {
  if (!sub) throw new Error("signAccessToken: sub is required");
  return jwt.sign(
    { sub: String(sub), role: role || "user" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

function signRefreshToken({ sub }) {
  if (!sub) throw new Error("signRefreshToken: sub is required");
  return jwt.sign(
    { sub: String(sub) },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

module.exports = { signAccessToken, signRefreshToken };
