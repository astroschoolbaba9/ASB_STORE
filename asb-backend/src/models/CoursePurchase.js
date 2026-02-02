const mongoose = require("mongoose");

const coursePurchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },

    status: { type: String, enum: ["PAID", "PENDING", "CANCELLED"], default: "PAID", index: true },
    currency: { type: String, default: "INR" },

    amountPaid: { type: Number, required: true, min: 0 },
    purchasedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// one purchase per user per course
coursePurchaseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("CoursePurchase", coursePurchaseSchema);
