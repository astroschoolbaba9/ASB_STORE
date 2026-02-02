const { asyncHandler } = require("../utils/asynchandler");
const adminGiftService = require("../services/admin.gift.service");

// GET /api/admin/gift-config
exports.getGiftConfig = asyncHandler(async (req, res) => {
  const config = await adminGiftService.getGiftConfig();
  res.json({ success: true, config });
});

// PUT /api/admin/gift-config
exports.updateGiftConfig = asyncHandler(async (req, res) => {
  const config = await adminGiftService.updateGiftConfig(req.body || {});
  res.json({ success: true, config });
});
