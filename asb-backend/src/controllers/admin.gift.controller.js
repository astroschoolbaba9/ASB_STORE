const { asynchandler } = require("../utils/asyncHandler");
const adminGiftService = require("../services/admin.gift.service");

// GET /api/admin/gift-config
exports.getGiftConfig = asynchandler(async (req, res) => {
  const config = await adminGiftService.getGiftConfig();
  res.json({ success: true, config });
});

// PUT /api/admin/gift-config
exports.updateGiftConfig = asynchandler(async (req, res) => {
  const config = await adminGiftService.updateGiftConfig(req.body || {});
  res.json({ success: true, config });
});
