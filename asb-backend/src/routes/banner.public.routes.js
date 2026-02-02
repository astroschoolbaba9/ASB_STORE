const express = require("express");
const router = express.Router();
const Banner = require("../models/banner");

// GET /api/banners (public)
router.get("/banners", async (req, res, next) => {
  try {
    const items = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("title subtitle clickUrl ctaPrimaryText ctaPrimaryLink ctaSecondaryText ctaSecondaryLink imagePath imageUrl isActive order createdAt");

    // Normalize: always provide imageUrl as "/uploads/...."
    const mapped = items.map((b) => {
      const raw =
        b.imageUrl ||
        b.imagePath ||
        "";

      // if someone saved full url -> keep it
      const finalUrl =
        raw.startsWith("http://") || raw.startsWith("https://")
          ? raw
          : raw
          ? raw.startsWith("/") ? raw : `/${raw}`
          : "";

      return {
        _id: b._id,
        title: b.title || "",
        subtitle: b.subtitle || "",
        clickUrl: b.clickUrl || "",
        ctaPrimaryText: b.ctaPrimaryText || "Book Consultation",
        ctaPrimaryLink: b.ctaPrimaryLink || "/contact",
        ctaSecondaryText: b.ctaSecondaryText || "Explore Products",
        ctaSecondaryLink: b.ctaSecondaryLink || "/shop",
        order: typeof b.order === "number" ? b.order : 0,
        isActive: b.isActive !== false,
        imageUrl: finalUrl, // ✅ always consistent
        createdAt: b.createdAt,
      };
    });

    res.json({ success: true, items: mapped });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
