const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // One of these will be set
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, default: "" },

    photos: { type: [String], default: [] },

    helpfulCount: { type: Number, default: 0 },
    helpfulBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

// ✅ IMPORTANT: Unique per user per product (only when productId exists)
reviewSchema.index(
  { productId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { productId: { $type: "objectId" } },
  }
);

// ✅ IMPORTANT: Unique per user per course (only when courseId exists)
reviewSchema.index(
  { courseId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { courseId: { $type: "objectId" } },
  }
);

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
