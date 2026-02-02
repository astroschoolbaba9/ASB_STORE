// backend/routes/admin.banner.routes.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { requireAuth, requireAdmin } = require("../middleware/auth");
const bannerController = require("../controllers/banner.controller");

const router = express.Router();

// Ensure upload dir exists
const uploadDir = path.join(__dirname, "..", "uploads", "banners");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    cb(null, `banner_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only JPG/PNG/WEBP allowed"), false);
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 4 * 1024 * 1024 } });

router.use(requireAuth, requireAdmin);

router.get("/banners", bannerController.adminListBanners);
router.post("/banners", upload.single("image"), bannerController.adminCreateBanner);
router.patch("/banners/:id", bannerController.adminUpdateBanner);
router.delete("/banners/:id", bannerController.adminDeleteBanner);

module.exports = router;
