const mongoose = require("mongoose");

const otpRequestSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    consumedAt: {
      type: Date,
      default: null,
    },

    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

// ✅ One active OTP per identifier+channel
otpRequestSchema.index({ identifier: 1, channel: 1 }, { unique: true });

// ✅ TTL index (AUTO DELETE after expiry)
otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.OtpRequest || mongoose.model("OtpRequest", otpRequestSchema);
