// backend/routes/gift.routes.js
const express = require("express");
const router = express.Router();

const GiftConfig = require("../models/GiftConfig");
const { AppError } = require("../utils/AppError");

// ✅ Use your existing auth middlewares (adjust path/names ONLY if your project differs)
const { requireAuth, requireAdmin } = require("../middleware/auth");

// helper: always return a single config doc
async function getOrCreateConfig() {
  let cfg = await GiftConfig.findOne({});
  if (!cfg) cfg = await GiftConfig.create({});
  return cfg;
}

/**
 * ✅ PUBLIC: Client uses this
 * GET /api/gift-config/public
 */
router.get("/public", async (req, res, next) => {
  try {
    const cfg = await getOrCreateConfig();

    // Send only public-safe fields
    res.json({
      success: true,
      config: {
        enabled: cfg.enabled !== false,

        bannerTitle: cfg.bannerTitle || "",
        bannerSubtitle: cfg.bannerSubtitle || "",
        bannerImageUrl: cfg.bannerImageUrl || "",

        giftWrapEnabled: cfg.giftWrapEnabled !== false,
        giftWrapPrice: Number(cfg.giftWrapPrice || 0),

        // ✅ your DB uses maxGiftMessageLength, client expects maxMessageLength
        maxMessageLength: Number(cfg.maxGiftMessageLength || 200),

        presets: Array.isArray(cfg.presets) ? cfg.presets : [],
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * ✅ ADMIN: Read config
 * GET /api/gift-config
 */
router.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const cfg = await getOrCreateConfig();
    res.json({ success: true, config: cfg });
  } catch (e) {
    next(e);
  }
});

/**
 * ✅ ADMIN: Save config
 * PUT /api/gift-config
 */
router.put("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const patch = req.body || {};
    const cfg = await getOrCreateConfig();

    // update only allowed fields
    const allowed = [
      "enabled",
      "bannerTitle",
      "bannerSubtitle",
      "bannerImageUrl",
      "giftWrapEnabled",
      "giftWrapPrice",
      "maxGiftMessageLength",
      "presets",
    ];

    allowed.forEach((k) => {
      if (k in patch) cfg[k] = patch[k];
    });

    await cfg.save();
    res.json({ success: true, config: cfg });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
