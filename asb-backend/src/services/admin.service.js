// backend/services/admin.service.js
const mongoose = require("mongoose");
const { AppError } = require("../utils/AppError");
const Order = require("../models/Order");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Course = require("../models/Course");
const GiftConfig = require("../models/GiftConfig");

function isObjectIdLike(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ""));
}

function toBoolOrUndefined(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return undefined;
}

// CATEGORY
async function createCategory(data) {
  const doc = {
    ...data,
    group: data.group || "shop",
    sortOrder: Number(data.sortOrder || 0),
    slug: String(data.slug).toLowerCase(),
  };
  const created = await Category.create(doc);
  return created;
}

async function updateCategory(id, data) {
  if (!isObjectIdLike(id)) throw new AppError("Invalid id", 400, "INVALID_ID");
  const patch = { ...(data || {}) };

  if (patch.slug) patch.slug = String(patch.slug).toLowerCase();
  if ("group" in patch) patch.group = patch.group || "shop";
  if ("sortOrder" in patch) patch.sortOrder = Number(patch.sortOrder || 0);

  const updated = await Category.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!updated) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  return updated;
}


async function deleteCategory(id) {
  if (!isObjectIdLike(id)) throw new AppError("Invalid id", 400, "INVALID_ID");
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  return true;
}

// PRODUCT
async function createProduct(data) {
  const doc = {
    ...data,
    slug: String(data.slug).toLowerCase(),

    // ✅ max 4 images
    images: Array.isArray(data.images) ? data.images.filter(Boolean).slice(0, 4) : [],

    isActive: data.isActive !== false,
    isFeatured: !!data.isFeatured,
    featuredOrder: Number(data.featuredOrder || 0),
  };

  try {
    const created = await Product.create(doc);
    return created;
  } catch (e) {
    if (String(e?.code) === "11000") throw new AppError("Slug already exists", 409, "DUPLICATE_SLUG");
    throw e;
  }
}

async function updateProduct(id, data) {
  if (!isObjectIdLike(id)) throw new AppError("Invalid id", 400, "INVALID_ID");

  const patch = { ...(data || {}) };
  if (patch.slug != null) patch.slug = String(patch.slug || "").toLowerCase();

  // ✅ max 4 images
  if ("images" in patch) {
    patch.images = Array.isArray(patch.images) ? patch.images.filter(Boolean).slice(0, 4) : [];
  }

  if ("isActive" in patch) patch.isActive = !!toBoolOrUndefined(patch.isActive);
  if ("isFeatured" in patch) patch.isFeatured = !!toBoolOrUndefined(patch.isFeatured);
  if ("featuredOrder" in patch) patch.featuredOrder = Number(patch.featuredOrder || 0);

  try {
    const updated = await Product.findByIdAndUpdate(id, { $set: patch }, { new: true });
    if (!updated) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    return updated;
  } catch (e) {
    if (String(e?.code) === "11000") throw new AppError("Slug already exists", 409, "DUPLICATE_SLUG");
    throw e;
  }
}

async function deleteProduct(id) {
  if (!isObjectIdLike(id)) throw new AppError("Invalid id", 400, "INVALID_ID");
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  return true;
}

// COURSE
function cleanLessons(lessons) {
  const arr = Array.isArray(lessons) ? lessons : [];
  return arr
    .map((l) => ({
      ...(l?._id ? { _id: l._id } : {}),
      title: String(l?.title || "").trim(),
      videoUrl: String(l?.videoUrl || "").trim(),
      durationSec: Number(l?.durationSec || 0),
      isFreePreview: !!l?.isFreePreview,
    }))
    .filter((l) => l.title);
}

async function createCourse(data) {
  const payload = {
    title: String(data.title || "").trim(),
    slug: String(data.slug || "").trim().toLowerCase(),
    description: String(data.description || ""),
    thumbnail: String(data.thumbnail || ""),
    price: Number(data.price || 0),
    mrp: Number(data.mrp || 0),

    isActive: data.isActive !== false,

    // ✅ NEW
    isFeatured: !!data.isFeatured,
    category: data.category || "General",
    featuredOrder: Number(data.featuredOrder || 0),
    lessons: cleanLessons(data.lessons),
  };

  try {
    const course = await Course.create(payload);
    return course;
  } catch (e) {
    if (String(e?.code) === "11000") throw new AppError("Slug already exists", 409, "DUPLICATE_SLUG");
    throw e;
  }
}

async function updateCourse(id, patch) {
  if (!isObjectIdLike(id)) throw new AppError("Invalid course id", 400, "INVALID_ID");

  const update = {};
  if (patch.title != null) update.title = String(patch.title || "").trim();
  if (patch.slug != null) update.slug = String(patch.slug || "").trim().toLowerCase();
  if (patch.description != null) update.description = String(patch.description || "");
  if (patch.thumbnail != null) update.thumbnail = String(patch.thumbnail || "");
  if (patch.price != null) update.price = Number(patch.price || 0);
  if (patch.mrp != null) update.mrp = Number(patch.mrp || 0);
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.isActive != null) update.isActive = !!toBoolOrUndefined(patch.isActive);
  if (patch.isActive != null) update.isActive = !!toBoolOrUndefined(patch.isActive);

  // ✅ NEW
  if (patch.isFeatured != null) update.isFeatured = !!toBoolOrUndefined(patch.isFeatured);
  if (patch.featuredOrder != null) update.featuredOrder = Number(patch.featuredOrder || 0);
  if (patch.lessons != null) update.lessons = cleanLessons(patch.lessons);

  try {
    const course = await Course.findByIdAndUpdate(id, update, { new: true });
    if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");
    return course;
  } catch (e) {
    if (String(e?.code) === "11000") throw new AppError("Slug already exists", 409, "DUPLICATE_SLUG");
    throw e;
  }
}

async function deleteCourse(id) {
  if (!isObjectIdLike(id)) throw new AppError("Invalid course id", 400, "INVALID_ID");
  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");
  await Course.deleteOne({ _id: id });
  return true;
}

// ADMIN: Orders list + search
async function listOrders({ page = 1, limit = 20, status, giftOnly, q }) {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;
  const filter = {};

  if (status) filter.status = String(status).toUpperCase();
  if (giftOnly === true || giftOnly === "true") filter["items.isGift"] = true;

  if (q && String(q).trim()) {
    const s = String(q).trim();
    const or = [];

    if (isObjectIdLike(s)) or.push({ _id: s });

    or.push({ "items.recipientName": { $regex: s, $options: "i" } });
    or.push({ "items.recipientPhone": { $regex: s, $options: "i" } });
    or.push({ "items.giftMessage": { $regex: s, $options: "i" } });

    or.push({ "shippingAddress.fullName": { $regex: s, $options: "i" } });
    or.push({ "shippingAddress.phone": { $regex: s, $options: "i" } });
    or.push({ "shippingAddress.email": { $regex: s, $options: "i" } });

    const matchedUsers = await User.find({
      $or: [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
      ],
    }).select("_id");

    if (matchedUsers.length) {
      or.push({ userId: { $in: matchedUsers.map((u) => u._id) } });
    }

    filter.$or = or;
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", select: "name email phone" })
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function getOrderById(orderId) {
  const order = await Order.findById(orderId).populate({
    path: "userId",
    select: "name email phone",
  });

  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  return order;
}

// DASHBOARD STATS
async function getDashboardStats() {
  const [totalOrders, paidOrders, pendingOrders, failedOrders, cancelledOrders] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: "PAID" }),
    Order.countDocuments({ status: "PENDING" }),
    Order.countDocuments({ status: "FAILED" }),
    Order.countDocuments({ status: "CANCELLED" }),
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { status: "PAID" } },
    { $group: { _id: null, revenue: { $sum: "$total" } } },
  ]);
  const revenue = revenueAgg?.[0]?.revenue || 0;

  const giftOrders = await Order.countDocuments({ "items.isGift": true });
  const totalUsers = await User.countDocuments({});

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const last7dAgg = await Order.aggregate([
    { $match: { status: "PAID", createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
          d: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
  ]);

  const last7d = last7dAgg.map((x) => ({
    date: `${x._id.y}-${String(x._id.m).padStart(2, "0")}-${String(x._id.d).padStart(2, "0")}`,
    revenue: x.revenue || 0,
    orders: x.orders || 0,
  }));

  return {
    revenue,
    totalOrders,
    paidOrders,
    pendingOrders,
    failedOrders,
    cancelledOrders,
    giftOrders,
    totalUsers,
    last7d,
  };
}

module.exports = {
  getDashboardStats,

  // orders
  listOrders,
  getOrderById,

  // category
  createCategory,
  updateCategory,
  deleteCategory,

  // product
  createProduct,
  updateProduct,
  deleteProduct,

  // course
  createCourse,
  updateCourse,
  deleteCourse,
};
