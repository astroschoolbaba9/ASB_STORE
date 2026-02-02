const { asyncHandler } = require("../utils/asynchandler");
const GiftConfig = require("../models/GiftConfig");

const getPublicGiftConfig = asyncHandler(async (req, res) => {
  let cfg = await GiftConfig.findOne();
  if (!cfg) cfg = await GiftConfig.create({});

  res.json({
    success: true,
    config: {
      enabled: cfg.enabled !== false,
      bannerTitle: cfg.bannerTitle || "",
      bannerSubtitle: cfg.bannerSubtitle || "",
      bannerImageUrl: cfg.bannerImageUrl || "",
      giftWrapEnabled: cfg.giftWrapEnabled !== false,
      giftWrapPrice: Number(cfg.giftWrapPrice || 0),
      maxGiftMessageLength: Number(cfg.maxGiftMessageLength || 200),
      presets: Array.isArray(cfg.presets) ? cfg.presets : []
    }
  });
});

module.exports = { getPublicGiftConfig };
