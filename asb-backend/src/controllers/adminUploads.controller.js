const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// Ensure folders exist
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const PRODUCTS_DIR = path.join(__dirname, "..", "uploads", "products");
const COURSES_DIR = path.join(__dirname, "..", "uploads", "courses");
ensureDir(PRODUCTS_DIR);
ensureDir(COURSES_DIR);

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRODUCTS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = `prod_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const courseStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COURSES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = `course_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// Basic image filter (optional but recommended)
function imageOnly(req, file, cb) {
  const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype || "");
  if (!ok) return cb(new Error("Only image files are allowed"));
  cb(null, true);
}

const productUpload = multer({ storage: productStorage, fileFilter: imageOnly });
const courseUpload = multer({ storage: courseStorage, fileFilter: imageOnly });

router.use(requireAuth, requireAdmin);

// ✅ Upload multiple product images (field: "images") — MAX 4
router.post("/uploads/products", productUpload.array("images", 4), (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const urls = files
    .map((f) => `/uploads/products/${f.filename}`)
    .filter(Boolean)
    .slice(0, 4);

  res.status(201).json({ success: true, images: urls });
});

// ✅ Upload single course thumbnail (field: "thumbnail")
router.post("/uploads/courses/thumbnail", courseUpload.single("thumbnail"), (req, res) => {
  const f = req.file;
  if (!f) {
    return res.status(400).json({ success: false, code: "NO_FILE", message: "No file uploaded" });
  }
  const url = `/uploads/courses/${f.filename}`;
  res.status(201).json({ success: true, url });
});

module.exports = router;
