// asb-backend/src/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // null for global broadcast
    isBroadcast: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["order", "cosmic", "course", "system", "broadcast"], default: "system", index: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of user IDs who read the broadcast
    read: { type: Boolean, default: false }, // For personal user notifications
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
