// backend/utils/tokens.js
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signAccessToken(userId) {
  return jwt.sign(
    { sub: String(userId) },          // ✅ REQUIRED (your middleware uses payload.sub)
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

function signRefreshToken(userId) {
  return jwt.sign(
    { sub: String(userId) },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

module.exports = { signAccessToken, signRefreshToken };
