const mongoose = require("mongoose");

const giftConfigSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },

    bannerTitle: { type: String, default: "Make it a Gift!" },
    bannerSubtitle: { type: String, default: "" },
    bannerImageUrl: { type: String, default: "" },

    giftWrapEnabled: { type: Boolean, default: true },
    giftWrapPrice: { type: Number, default: 0 },

    maxGiftMessageLength: { type: Number, default: 200 },

    presets: [{ type: String }]
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.GiftConfig || mongoose.model("GiftConfig", giftConfigSchema);
