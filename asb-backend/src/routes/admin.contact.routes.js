const express = require("express");
const ContactMessage = require("../models/ContactMessage");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const ExcelJS = require("exceljs");
const router = express.Router();

// List messages (admin only)
router.get("/contact-messages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const status = String(req.query.status || "").trim().toUpperCase();

    const filter = {};
    if (status === "NEW" || status === "READ") filter.status = status;

    const total = await ContactMessage.countDocuments(filter);
    const items = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id name phone email message status source createdAt updatedAt");

    res.json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    next(err);
  }
});

// Update status (admin only)
router.patch("/contact-messages/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    const status = String(req.body?.status || "").trim().toUpperCase();

    if (!["NEW", "READ"].includes(status)) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid status",
        details: { allowed: ["NEW", "READ"] },
      });
    }

    const doc = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("_id status updatedAt");

    if (!doc) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Message not found",
      });
    }

    res.json({ success: true, item: doc });
  } catch (err) {
    next(err);
  }
});

router.get("/contact-messages/export", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.query?.status || "").trim().toUpperCase();

    const filter = {};
    if (status === "NEW" || status === "READ") filter.status = status;

    const items = await ContactMessage.find(filter).sort({ createdAt: -1 }).lean();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Contact Leads");

    ws.columns = [
      { header: "Status", key: "status", width: 10 },
      { header: "Name", key: "name", width: 22 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Email", key: "email", width: 28 },
      { header: "Message", key: "message", width: 60 },
      { header: "Source", key: "source", width: 16 },
      { header: "Created At", key: "createdAt", width: 22 },
      { header: "Updated At", key: "updatedAt", width: 22 },
      { header: "ID", key: "_id", width: 28 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const m of items) {
      ws.addRow({
        status: m.status || "NEW",
        name: m.name || "",
        phone: m.phone || "",
        email: m.email || "",
        message: String(m.message || "").replace(/\r?\n/g, " "),
        source: m.source || "contact_page",
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : "",
        updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : "",
        _id: String(m._id || ""),
      });
    }

    const safeStatus = status === "NEW" || status === "READ" ? status : "ALL";
    const fileName = `contact-leads-${safeStatus}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    // ✅ Make Excel as a buffer (no stream corruption)
    const buffer = await wb.xlsx.writeBuffer();

    res.status(200);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);

    return res.send(Buffer.from(buffer));
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
