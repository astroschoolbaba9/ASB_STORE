const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "ASB Backend OK",
    time: new Date().toISOString()
  });
});

module.exports = router; // ✅ IMPORTANT
