const express = require("express");
const router = express.Router();
const AdminAuditLog = require("../models/AdminAuditLog");

router.get("/audit-logs", async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AdminAuditLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("adminId", "phone email"),
    AdminAuditLog.countDocuments(),
  ]);

  res.json({
    success: true,
    items,
    page,
    pages: Math.ceil(total / limit),
  });
});

module.exports = router;
