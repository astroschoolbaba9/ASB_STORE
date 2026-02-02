const Banner = require("../models/banner");
const { AppError } = require("../utils/AppError");

async function listActiveBanners() {
  const now = new Date();

  const items = await Banner.find({
    isActive: true,
    $and: [
      { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $gt: now } }] }
    ]
  })
    .sort({ order: 1, createdAt: -1 })
    .select("title subtitle imageUrl clickUrl ctaPrimaryText ctaPrimaryLink ctaSecondaryText ctaSecondaryLink isActive order startAt endAt createdAt");

  return items;
}

async function adminListBanners() {
  const items = await Banner.find({})
    .sort({ order: 1, createdAt: -1 })
    .select("title subtitle imageUrl clickUrl ctaPrimaryText ctaPrimaryLink ctaSecondaryText ctaSecondaryLink isActive order startAt endAt createdAt");

  return items;
}

async function adminCreateBanner(payload) {
  if (!payload.imageUrl) throw new AppError("Image is required", 400, "IMAGE_REQUIRED");

  const doc = { ...payload };

  doc.startAt = doc.startAt ? new Date(doc.startAt) : null;
  doc.endAt = doc.endAt ? new Date(doc.endAt) : null;

  const banner = await Banner.create(doc);
  return banner;
}

async function adminUpdateBanner(id, patch) {
  const upd = { ...(patch || {}) };

  if ("startAt" in upd) upd.startAt = upd.startAt ? new Date(upd.startAt) : null;
  if ("endAt" in upd) upd.endAt = upd.endAt ? new Date(upd.endAt) : null;

  const banner = await Banner.findByIdAndUpdate(id, upd, { new: true });
  if (!banner) throw new AppError("Banner not found", 404, "BANNER_NOT_FOUND");
  return banner;
}

async function adminDeleteBanner(id) {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) throw new AppError("Banner not found", 404, "BANNER_NOT_FOUND");
  return true;
}

module.exports = {
  listActiveBanners,
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner
};
