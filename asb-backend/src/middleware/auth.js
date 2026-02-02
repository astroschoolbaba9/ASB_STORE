const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");

async function requireAuth(req, res, next) {
  if (req.method === "OPTIONS") return next();

  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();

  if (!token || token === header.trim()) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      details: { reason: "NO_BEARER_TOKEN" },
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (e) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      details: { reason: "JWT_VERIFY_FAILED", jwt: e.message },
    });
  }

  const user = await User.findById(payload.sub).select("_id role name email phone createdAt isBlocked");
  if (!user) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      details: { reason: "USER_NOT_FOUND", sub: payload.sub },
    });
  }

  req.user = user;
  return next();
}

function requireAdmin(req, res, next) {
  const role = String(req.user?.role || "").toUpperCase();
  if (role === "ADMIN") return next();
  return res.status(403).json({
    success: false,
    code: "FORBIDDEN",
    message: "Admin only",
  });
}

module.exports = { requireAuth, requireAdmin };
