const crypto = require("crypto");

function generateOtp() {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  // sha256 is fine for dev; you can switch to bcrypt later
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

module.exports = { generateOtp, hashOtp };
