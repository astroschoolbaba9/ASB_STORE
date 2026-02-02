const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },

    imageUrl: { type: String, required: true },
    clickUrl: { type: String, default: "" },

    ctaPrimaryText: { type: String, default: "Book Consultation" },
    ctaPrimaryLink: { type: String, default: "/contact" },

    ctaSecondaryText: { type: String, default: "Explore Products" },
    ctaSecondaryLink: { type: String, default: "/shop" },

    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    // ✅ SCHEDULING
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", BannerSchema);
