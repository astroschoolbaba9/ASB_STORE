// backend/routes/banner.routes.js
const express = require("express");
const router = express.Router();

const bannerController = require("../controllers/banner.controller");

router.get("/banners/active", bannerController.getActiveBanners);

module.exports = router;
