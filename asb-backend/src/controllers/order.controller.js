const { asyncHandler } = require("../utils/asynchandler");
const { AppError } = require("../utils/AppError");
const orderService = require("../services/order.service");
const { checkoutSchema } = require("../validators/order.validators");

const checkout = asyncHandler(async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body || {});
  if (!parsed.success) throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const order = await orderService.checkoutFromCart(req.user._id, parsed.data);
  res.status(201).json({ success: true, order });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  const result = await orderService.listOrders(req.user._id, { page, limit });
  res.json({ success: true, ...result });
});

const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user._id, req.params.id);
  res.json({ success: true, order });
});

module.exports = { checkout, listMyOrders, getMyOrderById };
