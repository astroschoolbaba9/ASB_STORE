// backend/config/env.js
const dotenv = require("dotenv");
dotenv.config();

function req(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === null || v === "") {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGODB_URI: req("MONGODB_URI"),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  JWT_ACCESS_SECRET: req("JWT_ACCESS_SECRET"),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",

  JWT_REFRESH_SECRET: req("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  OTP_DEV_MODE: String(process.env.OTP_DEV_MODE || "false").toLowerCase() === "true",
  OTP_TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS || 300),

  RATE_LIMIT_WINDOW_MIN: Number(process.env.RATE_LIMIT_WINDOW_MIN || 15),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 200),
};

module.exports = { env };
