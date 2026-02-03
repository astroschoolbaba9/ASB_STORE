const { asynchandler } = require("../utils/asyncHandler");
const adminService = require("../services/admin.service");

// GET /api/admin/dashboard-stats
exports.getDashboardStats = asynchandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, stats });
});
