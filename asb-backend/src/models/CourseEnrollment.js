const mongoose = require("mongoose");

const courseEnrollmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },

    status: { type: String, enum: ["ACTIVE", "EXPIRED"], default: "ACTIVE", index: true },

    purchasedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },

    payment: {
      provider: { type: String, default: "" }, // PAYU
      txnid: { type: String, default: "" },
      mihpayid: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      paidAt: { type: Date },
    },
  },
  { timestamps: true }
);

courseEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports =
  mongoose.models.CourseEnrollment || mongoose.model("CourseEnrollment", courseEnrollmentSchema);
