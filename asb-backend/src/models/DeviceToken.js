// asb-backend/src/models/DeviceToken.js
const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    pushToken: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
    platform: { type: String, enum: ["android", "ios", "web", "unknown"], default: "unknown" },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);
