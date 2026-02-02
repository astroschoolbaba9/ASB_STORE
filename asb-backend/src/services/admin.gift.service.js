const GiftConfig = require("../models/GiftConfig");

async function getGiftConfig() {
  let doc = await GiftConfig.findOne({});
  if (!doc) doc = await GiftConfig.create({});
  return doc;
}

async function updateGiftConfig(patch = {}) {
  let doc = await GiftConfig.findOne({});
  if (!doc) doc = await GiftConfig.create({});

  const allowed = [
    "enabled",
    "bannerTitle",
    "bannerSubtitle",
    "bannerImageUrl",
    "giftWrapEnabled",
    "giftWrapPrice",
    "maxGiftMessageLength",
    "presets"
  ];

  for (const k of allowed) {
    if (patch[k] !== undefined) doc[k] = patch[k];
  }

  // sanitize presets
  if (patch.presets !== undefined) {
    const arr = Array.isArray(patch.presets) ? patch.presets : [];
    doc.presets = arr
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .slice(0, 100);
  }

  // sanitize numbers
  doc.giftWrapPrice = Number(doc.giftWrapPrice || 0);
  doc.maxGiftMessageLength = Math.max(0, Math.min(Number(doc.maxGiftMessageLength || 0), 1000));

  await doc.save();
  return doc;
}

module.exports = { getGiftConfig, updateGiftConfig };
