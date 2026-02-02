const mongoose = require("mongoose");
const { AppError } = require("../utils/AppError");
const Review = require("../models/Review");

function isObjectIdLike(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ""));
}

function pickSort(sort) {
  const s = String(sort || "newest").toLowerCase();
  if (s === "highest") return { rating: -1, createdAt: -1 };
  if (s === "lowest") return { rating: 1, createdAt: -1 };
  return { createdAt: -1 };
}

async function listReviews({ productId, courseId, page = 1, limit = 10, sort = "newest" }) {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  const filter = {};
  if (productId) {
    if (!isObjectIdLike(productId)) throw new AppError("Invalid productId", 400, "INVALID_PRODUCT_ID");
    filter.productId = productId;
  }
  if (courseId) {
    if (!isObjectIdLike(courseId)) throw new AppError("Invalid courseId", 400, "INVALID_COURSE_ID");
    filter.courseId = courseId;
  }

  if (!filter.productId && !filter.courseId) {
    throw new AppError("productId or courseId is required", 400, "TARGET_REQUIRED");
  }

  const skip = (page - 1) * limit;

  const [items, total, summaryAgg] = await Promise.all([
    Review.find(filter)
      .sort(pickSort(sort))
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", select: "name" })
      .select("rating title comment createdAt userId"),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ])
  ]);

  const summary = {
    avgRating: Number(summaryAgg?.[0]?.avgRating || 0),
    count: Number(summaryAgg?.[0]?.count || 0)
  };

  return { items, summary, page, limit, total, totalPages: Math.ceil(total / limit) };
}

async function createReview({ userId, productId, courseId, rating, title, comment }) {
  if (!userId || !isObjectIdLike(userId)) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

  const hasProduct = !!productId;
  const hasCourse = !!courseId;

  if (hasProduct === hasCourse) {
    // both true or both false
    throw new AppError("Send productId OR courseId (exactly one)", 400, "INVALID_TARGET");
  }

  if (hasProduct && !isObjectIdLike(productId)) throw new AppError("Invalid productId", 400, "INVALID_PRODUCT_ID");
  if (hasCourse && !isObjectIdLike(courseId)) throw new AppError("Invalid courseId", 400, "INVALID_COURSE_ID");

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new AppError("rating must be between 1 and 5", 400, "INVALID_RATING");
  }

  const payload = {
    userId,
    productId: hasProduct ? productId : null,
    courseId: hasCourse ? courseId : null,
    rating: r,
    title: String(title || "").trim(),
    comment: String(comment || "").trim()
  };

  try {
    const doc = await Review.create(payload);
    return doc;
  } catch (e) {
    // duplicate review (unique index)
    if (String(e?.code) === "11000") {
      throw new AppError("You already reviewed this item", 409, "DUPLICATE_REVIEW");
    }
    throw e;
  }
}

module.exports = { listReviews, createReview };
