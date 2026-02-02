const { asyncHandler } = require("../utils/asynchandler");
const adminService = require("../services/admin.service");

// GET /api/admin/dashboard-stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, stats });
});
