const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const GiftConfig = require("../models/GiftConfig");
const { AppError } = require("../utils/AppError");

function isObjectIdLike(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ""));
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

async function readGiftConfig() {
  // ensure 1 config exists
  let cfg = await GiftConfig.findOne();
  if (!cfg) cfg = await GiftConfig.create({});
  return cfg;
}

function computeShipping(subtotal, itemCount) {
  if (!itemCount) return 0;
  return subtotal > 1499 ? 0 : 99;
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);

  await cart.populate({
    path: "items.productId",
    select: "title price mrp stock images isActive categoryId category"
  });

  const items = cart.items.filter((it) => it.productId && it.productId.isActive);

  // totals
  const subtotal = items.reduce((sum, it) => {
    const p = it.productId;
    const price = Number(p?.price || 0);
    const qty = Number(it.qty || 0);
    return sum + price * qty;
  }, 0);

  const shipping = computeShipping(subtotal, items.length);

  const cfg = await readGiftConfig();
  const enabled = cfg.enabled !== false;
  const wrapEnabled = cfg.giftWrapEnabled !== false;
  const wrapPrice = Number(cfg.giftWrapPrice || 0);

  const giftWrapQty = items.reduce((acc, it) => {
    if (!enabled || !wrapEnabled) return acc;
    if (!it.isGift) return acc;
    if (!it.giftWrap) return acc;
    return acc + Number(it.qty || 0);
  }, 0);

  const giftWrapTotal = enabled && wrapEnabled ? wrapPrice * giftWrapQty : 0;
  const grandTotal = subtotal + shipping + giftWrapTotal;

  return {
    id: cart._id,
    items: items.map((it) => ({
      itemId: it._id,
      product: it.productId,
      qty: it.qty,

      isGift: it.isGift,
      giftWrap: it.giftWrap,
      giftOccasion: it.giftOccasion || "",
      giftMessage: it.giftMessage,
      recipientName: it.recipientName,
      recipientPhone: it.recipientPhone
    })),
    totals: {
      subtotal,
      discount: 0,
      shipping,
      giftWrapTotal,
      grandTotal
    },
    updatedAt: cart.updatedAt
  };
}

async function addItem(userId, payload) {
  if (!isObjectIdLike(payload.productId)) throw new AppError("Invalid productId", 400, "INVALID_ID");

  const product = await Product.findOne({ _id: payload.productId, isActive: true }).select("price stock title");
  if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");

  const qty = Number(payload.qty || 1);
  if (qty > product.stock) {
    throw new AppError("Requested quantity exceeds stock", 400, "OUT_OF_STOCK", { stock: product.stock });
  }

  const cart = await getOrCreateCart(userId);

  const existing = cart.items.find((it) => it.productId.toString() === String(payload.productId));
  if (existing) {
    const newQty = Number(existing.qty || 0) + qty;
    if (newQty > product.stock) {
      throw new AppError("Requested quantity exceeds stock", 400, "OUT_OF_STOCK", { stock: product.stock });
    }
    existing.qty = newQty;

    // if user sent gift fields, update them too
    if (payload.isGift != null) existing.isGift = payload.isGift;
    if (payload.giftWrap != null) existing.giftWrap = payload.giftWrap;
    if (payload.giftOccasion != null) existing.giftOccasion = payload.giftOccasion;
    if (payload.giftMessage != null) existing.giftMessage = payload.giftMessage;
    if (payload.recipientName != null) existing.recipientName = payload.recipientName;
    if (payload.recipientPhone != null) existing.recipientPhone = payload.recipientPhone;
  } else {
    cart.items.push({
      productId: payload.productId,
      qty,

      isGift: payload.isGift || false,
      giftWrap: payload.giftWrap || false,
      giftOccasion: payload.giftOccasion || "",
      giftMessage: payload.giftMessage || "",

      recipientName: payload.recipientName || "",
      recipientPhone: payload.recipientPhone || ""
    });
  }

  await cart.save();
  return getCart(userId);
}

async function updateItem(userId, itemId, patch) {
  if (!isObjectIdLike(itemId)) throw new AppError("Invalid itemId", 400, "INVALID_ID");

  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw new AppError("Cart item not found", 404, "CART_ITEM_NOT_FOUND");

  // If qty update, validate stock
  if (patch.qty != null) {
    const product = await Product.findById(item.productId).select("stock isActive");
    if (!product || !product.isActive) throw new AppError("Product not available", 400, "PRODUCT_NOT_AVAILABLE");
    if (Number(patch.qty) > Number(product.stock || 0)) {
      throw new AppError("Requested quantity exceeds stock", 400, "OUT_OF_STOCK", { stock: product.stock });
    }
    item.qty = Number(patch.qty);
  }

  // Gift updates
  if (patch.isGift != null) item.isGift = patch.isGift;
  if (patch.giftWrap != null) item.giftWrap = patch.giftWrap;
  if (patch.giftOccasion != null) item.giftOccasion = patch.giftOccasion;
  if (patch.giftMessage != null) item.giftMessage = patch.giftMessage;

  if (patch.recipientName != null) item.recipientName = patch.recipientName;
  if (patch.recipientPhone != null) item.recipientPhone = patch.recipientPhone;

  await cart.save();
  return getCart(userId);
}

async function removeItem(userId, itemId) {
  if (!isObjectIdLike(itemId)) throw new AppError("Invalid itemId", 400, "INVALID_ID");

  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw new AppError("Cart item not found", 404, "CART_ITEM_NOT_FOUND");

  item.deleteOne();
  await cart.save();
  return getCart(userId);
}

module.exports = { getCart, addItem, updateItem, removeItem };
