const { asyncHandler } = require("../utils/asynchandler");
const { AppError } = require("../utils/AppError");
const cartService = require("../services/cart.service");
const { addItemSchema, updateItemSchema } = require("../validators/cart.validators");

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  res.json({ success: true, cart });
});

const addItem = asyncHandler(async (req, res) => {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const cart = await cartService.addItem(req.user._id, parsed.data);
  res.status(201).json({ success: true, cart });
});

const updateItem = asyncHandler(async (req, res) => {
  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const cart = await cartService.updateItem(req.user._id, req.params.itemId, parsed.data);
  res.json({ success: true, cart });
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.itemId);
  res.json({ success: true, cart });
});

module.exports = { getCart, addItem, updateItem, removeItem };
