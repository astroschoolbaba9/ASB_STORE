// services/order.service.js
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { AppError } = require("../utils/AppError");

function num(n, d = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : d;
}

function clampQty(qty) {
  const q = Math.floor(num(qty, 1));
  if (q < 1) return 1;
  if (q > 50) return 50;
  return q;
}

async function checkoutFromCart(userId, payload) {
  const itemsInput = Array.isArray(payload.items) ? payload.items : [];
  if (!itemsInput.length) throw new AppError("Cart is empty", 400, "CART_EMPTY");

  const productIds = itemsInput.map((it) => it.productId).filter(Boolean);
  const uniqueIds = [...new Set(productIds.map(String))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const products = await Product.find({ _id: { $in: uniqueIds }, isActive: true })
    .select("_id title price mrp stock images categoryId")
    .lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = [];
  let subtotal = 0;
  let giftWrapTotal = 0;

  for (const it of itemsInput) {
    const pid = String(it.productId || "");
    const p = byId.get(pid);

    if (!p) {
      throw new AppError(`Product not found or inactive: ${pid}`, 400, "PRODUCT_NOT_FOUND");
    }

    const requestedQty = clampQty(it.qty);
    const available = num(p.stock, 0);

    if (available <= 0) {
      throw new AppError(`Out of stock: ${p.title}`, 400, "OUT_OF_STOCK", {
        productId: pid,
        stock: 0
      });
    }

    const finalQty = Math.min(requestedQty, available);

    const unitPrice = num(p.price, 0);
    const unitMrp = num(p.mrp, 0);

    const giftWrap = Boolean(it.giftWrap);
    const giftWrapPrice = giftWrap ? num(it.giftWrapPrice, 0) : 0;

    subtotal += unitPrice * finalQty;
    giftWrapTotal += giftWrapPrice * finalQty;

    orderItems.push({
      productId: p._id,
      title: String(p.title || ""),
      price: unitPrice,
      mrp: unitMrp,
      qty: finalQty,
      image: Array.isArray(p.images) && p.images.length ? String(p.images[0]) : "",
      categoryName: String(it.categoryName || ""),

      isGift: Boolean(it.isGift),
      giftWrap,
      giftWrapPrice,

      giftOccasion: String(it.giftOccasion || ""),
      giftMessage: String(it.giftMessage || ""),
      recipientName: String(it.recipientName || ""),
      recipientPhone: String(it.recipientPhone || "")
    });
  }

  const discount = num(payload.discount, 0);
  const shipping = num(payload.shipping, 0);
  const total = Math.max(0, subtotal - discount + shipping + giftWrapTotal);

  const shippingAddress = payload.shippingAddress || {};
  const payment = payload.payment || {};

  const order = await Order.create({
    userId,
    status: "PENDING",
    fulfilmentStatus: "PLACED",

    items: orderItems,
    currency: "INR",

    subtotal,
    discount,
    shipping,
    giftWrapTotal,
    total,

    shippingAddress: {
      fullName: String(shippingAddress.fullName || ""),
      phone: String(shippingAddress.phone || ""),
      email: String(shippingAddress.email || ""),
      line1: String(shippingAddress.line1 || ""),
      line2: String(shippingAddress.line2 || ""),
      city: String(shippingAddress.city || ""),
      state: String(shippingAddress.state || ""),
      pincode: String(shippingAddress.pincode || ""),
      landmark: String(shippingAddress.landmark || "")
    },

    payment: {
      method: String(payment.method || "COD"),
      status: "PENDING",
      provider: String(payment.provider || ""),
      transactionId: String(payment.transactionId || "")
    },

    tracking: {
      courier: "",
      trackingId: "",
      trackingUrl: ""
    },

    statusHistory: [
      {
        by: userId,
        action: "ORDER_CREATED",
        note: "",
        status: "PENDING",
        fulfilmentStatus: "PLACED"
      }
    ],

    notes: String(payload.notes || "")
  });

  return order;
}

async function listOrders(userId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments({ userId })
  ]);

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function getOrderById(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  return order;
}

// ✅ Admin list
async function adminListOrders({ page = 1, limit = 20, q = "" } = {}) {
  const skip = (page - 1) * limit;

  const filter = {};
  if (q && String(q).trim()) {
    const s = String(q).trim();
    filter.$or = [
      { "shippingAddress.phone": { $regex: s, $options: "i" } },
      { "shippingAddress.fullName": { $regex: s, $options: "i" } },
      { "shippingAddress.email": { $regex: s, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function adminGetOrderById(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  return order;
}

// ✅ Phase 3: fulfilment update
async function adminUpdateFulfilmentStatus({ orderId, adminId, fulfilmentStatus, note = "" }) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  const next = String(fulfilmentStatus || "").toUpperCase();
  const allowed = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(next)) {
    throw new AppError("Invalid fulfilmentStatus", 400, "VALIDATION_ERROR", { allowed });
  }

  if (next === "CANCELLED") {
    order.fulfilmentStatus = "CANCELLED";
    order.status = "CANCELLED";
  } else {
    order.fulfilmentStatus = next;
  }

  order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  order.statusHistory.push({
    by: adminId,
    action: "FULFILMENT_STATUS_UPDATED",
    note: String(note || "").slice(0, 300),
    status: order.status,
    fulfilmentStatus: order.fulfilmentStatus
  });

  await order.save();
  return order.toObject();
}

// ✅ Phase 3: tracking update
async function adminUpdateTracking({ orderId, adminId, tracking, note = "" }) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  order.tracking = {
    courier: String(tracking?.courier || "").slice(0, 80),
    trackingId: String(tracking?.trackingId || "").slice(0, 120),
    trackingUrl: String(tracking?.trackingUrl || "").slice(0, 500)
  };

  order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  order.statusHistory.push({
    by: adminId,
    action: "TRACKING_UPDATED",
    note: String(note || "").slice(0, 300),
    status: order.status,
    fulfilmentStatus: order.fulfilmentStatus
  });

  await order.save();
  return order.toObject();
}

async function markOrderPaid(userId, orderId, meta = {}) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  order.status = "PAID";
  order.fulfilmentStatus = order.fulfilmentStatus === "PLACED" ? "CONFIRMED" : order.fulfilmentStatus;

  order.payment = order.payment || {};
  order.payment.method = order.payment.method || "ONLINE_PENDING";
  order.payment.status = "PAID";
  order.payment.provider = meta.provider || "PAYU";
  order.payment.transactionId = String(meta.txnid || meta.mihpayid || "");
  order.payment.paidAt = new Date();

  order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  order.statusHistory.push({
    by: userId,
    action: "PAYMENT_SUCCESS",
    note: "",
    status: order.status,
    fulfilmentStatus: order.fulfilmentStatus
  });

  await order.save();
  return order.toObject();
}

async function markOrderFailed(userId, orderId, meta = {}) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  order.status = "FAILED";

  order.payment = order.payment || {};
  order.payment.method = order.payment.method || "ONLINE_PENDING";
  order.payment.status = "FAILED";
  order.payment.provider = meta.provider || "PAYU";
  order.payment.transactionId = String(meta.txnid || meta.mihpayid || "");

  order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  order.statusHistory.push({
    by: userId,
    action: "PAYMENT_FAILED",
    note: "",
    status: order.status,
    fulfilmentStatus: order.fulfilmentStatus
  });

  await order.save();
  return order.toObject();
}


module.exports = {
  checkoutFromCart,
  listOrders,
  getOrderById,
  adminListOrders,
  adminGetOrderById,
  adminUpdateFulfilmentStatus,
  adminUpdateTracking,
  markOrderPaid,
  markOrderFailed
};
