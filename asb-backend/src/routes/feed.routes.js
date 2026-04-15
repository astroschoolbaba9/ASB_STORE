const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feed.controller");

router.get("/google-feed", feedController.getGoogleMerchantFeed);

module.exports = router;
