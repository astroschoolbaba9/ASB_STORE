// backend/controllers/banner.controller.js
const { asyncHandler } = require("../utils/asynchandler");
const bannerService = require("../services/banner.service");

const getActiveBanners = asyncHandler(async (req, res) => {
  const items = await bannerService.listActiveBanners();
  res.json({ success: true, items });
});

const adminListBanners = asyncHandler(async (req, res) => {
  const items = await bannerService.adminListBanners();
  res.json({ success: true, items });
});

const adminCreateBanner = asyncHandler(async (req, res) => {
  // multer puts file at req.file
  const file = req.file;

  const imageUrl = file
    ? `${req.protocol}://${req.get("host")}/uploads/banners/${file.filename}`
    : (req.body.imageUrl || "");

  const payload = {
    title: req.body.title || "",
    subtitle: req.body.subtitle || "",
    clickUrl: req.body.clickUrl || "",
    ctaPrimaryText: req.body.ctaPrimaryText || "Book Consultation",
    ctaPrimaryLink: req.body.ctaPrimaryLink || "/contact",
    ctaSecondaryText: req.body.ctaSecondaryText || "Explore Products",
    ctaSecondaryLink: req.body.ctaSecondaryLink || "/shop",
    isActive: String(req.body.isActive ?? "true") === "true",
    order: Number(req.body.order ?? 0),
    imageUrl,
    createdBy: req.user?._id || null,
  };

  const banner = await require("../services/banner.service").adminCreateBanner(payload);
  res.status(201).json({ success: true, banner });
});

const adminUpdateBanner = asyncHandler(async (req, res) => {
  const patch = { ...req.body };

  if (patch.order != null) patch.order = Number(patch.order);
  if (patch.isActive != null) patch.isActive = String(patch.isActive) === "true";

  const banner = await bannerService.adminUpdateBanner(req.params.id, patch);
  res.json({ success: true, banner });
});

const adminDeleteBanner = asyncHandler(async (req, res) => {
  await bannerService.adminDeleteBanner(req.params.id);
  res.json({ success: true });
});

module.exports = {
  getActiveBanners,
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
};
