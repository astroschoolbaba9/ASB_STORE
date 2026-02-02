const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },

    status: { type: Number, required: true },
    durationMs: { type: Number, required: true },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // Keep this light. Don’t store passwords/otp/token.
    body: { type: Object, default: null },
    query: { type: Object, default: null },
    params: { type: Object, default: null },

    // Optional: store error info
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
