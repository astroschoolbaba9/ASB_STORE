const { asynchandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const orderService = require("../services/order.service");

// GET /api/admin/orders
const listOrders = asynchandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const q = String(req.query.q || req.query.q === 0 ? req.query.q : req.query.q || "").trim();

  const result = await orderService.adminListOrders({ page, limit, q: String(q || "").trim() });
  res.json({ success: true, ...result });
});

// GET /api/admin/orders/:id
const getOrderById = asynchandler(async (req, res) => {
  const order = await orderService.adminGetOrderById(req.params.id);
  res.json({ success: true, order });
});

// PATCH /api/admin/orders/:id/fulfilment
const updateFulfilmentStatus = asynchandler(async (req, res) => {
  const next = String(req.body?.fulfilmentStatus || "").toUpperCase();
  const note = String(req.body?.note || "").slice(0, 300);

  const allowed = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(next)) {
    throw new AppError("Invalid fulfilmentStatus", 400, "VALIDATION_ERROR", { allowed });
  }

  const order = await orderService.adminUpdateFulfilmentStatus({
    orderId: req.params.id,
    adminId: req.user._id,
    fulfilmentStatus: next,
    note
  });

  res.json({ success: true, order });
});

// PATCH /api/admin/orders/:id/tracking
const updateTracking = asynchandler(async (req, res) => {
  const courier = String(req.body?.courier || "").slice(0, 80);
  const trackingId = String(req.body?.trackingId || "").slice(0, 120);
  const trackingUrl = String(req.body?.trackingUrl || "").slice(0, 500);
  const note = String(req.body?.note || "").slice(0, 300);

  const order = await orderService.adminUpdateTracking({
    orderId: req.params.id,
    adminId: req.user._id,
    tracking: { courier, trackingId, trackingUrl },
    note
  });

  res.json({ success: true, order });
});

module.exports = {
  listOrders,
  getOrderById,
  updateFulfilmentStatus,
  updateTracking
};
