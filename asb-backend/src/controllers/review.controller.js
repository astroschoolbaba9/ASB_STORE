const mongoose = require("mongoose");
const Review = require("../models/Review");
const { AppError } = require("../utils/AppError");
const { asynchandler } = require("../utils/asyncHandler");

function isObjectIdLike(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ""));
}

function clampInt(n, min, max, fallback) {
  const x = parseInt(n, 10);
  if (Number.isNaN(x)) return fallback;
  return Math.max(min, Math.min(max, x));
}

/**
 * GET /products/:id/reviews
 * Query:
 *  - page, limit
 *  - sort: latest | helpful | rating_high | rating_low
 *  - rating: 1..5 (filter)
 *  - withPhotos: true/false
 */
exports.getProductReviews = asynchandler(async (req, res) => {
  const productId = req.params.id;
  if (!isObjectIdLike(productId)) throw new AppError("Invalid product id", 400, "INVALID_ID");

  const page = clampInt(req.query.page, 1, 9999, 1);
  const limit = clampInt(req.query.limit, 1, 50, 10);
  const skip = (page - 1) * limit;

  const sort = String(req.query.sort || "latest");
  const ratingFilter = req.query.rating ? clampInt(req.query.rating, 1, 5, null) : null;
  const withPhotos = String(req.query.withPhotos || "") === "true";

  const pid = new mongoose.Types.ObjectId(productId);

  const filter = { productId: pid };
  if (ratingFilter) filter.rating = ratingFilter;
  if (withPhotos) filter.photos = { $exists: true, $ne: [] };

  let sortObj = { createdAt: -1 };
  if (sort === "helpful") sortObj = { helpfulCount: -1, createdAt: -1 };
  if (sort === "rating_high") sortObj = { rating: -1, createdAt: -1 };
  if (sort === "rating_low") sortObj = { rating: 1, createdAt: -1 };

  // Summary: counts by rating + avg + total
  const summaryAgg = await Review.aggregate([
    { $match: { productId: pid } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 }
      }
    }
  ]);

  const countsByRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of summaryAgg) {
    const r = Number(row._id);
    const c = Number(row.count || 0);
    if (countsByRating[r] !== undefined) countsByRating[r] = c;
  }

  const avgAgg = await Review.aggregate([
    { $match: { productId: pid } },
    { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } }
  ]);

  const avgRating = Number(avgAgg?.[0]?.avg || 0);
  const totalRatings = Number(avgAgg?.[0]?.total || 0);

  const [items, totalMatched] = await Promise.all([
    Review.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", select: "name" })
      .select("productId userId rating title comment photos helpfulCount createdAt"),
    Review.countDocuments(filter)
  ]);

  res.json({
    success: true,
    summary: {
      avgRating,
      totalRatings,
      countsByRating
    },
    page,
    limit,
    total: totalMatched,
    totalPages: Math.ceil(totalMatched / limit),
    items
  });
});

/**
 * POST /products/:id/reviews
 * Body: { rating, title, comment, photos? }
 * requireAuth
 * - server sets userId from req.user._id
 * - upsert (1 review per user per product)
 */
exports.upsertProductReview = asynchandler(async (req, res) => {
  const productId = req.params.id;
  if (!isObjectIdLike(productId)) throw new AppError("Invalid product id", 400, "INVALID_ID");
  if (!req.user?._id) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

  const rating = Number(req.body?.rating);
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400, "INVALID_RATING");
  }

  const title = String(req.body?.title || "").trim().slice(0, 120);
  const comment = String(req.body?.comment || "").trim().slice(0, 2000);

  const photos = Array.isArray(req.body?.photos)
    ? req.body.photos.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 6)
    : [];

  const pid = new mongoose.Types.ObjectId(productId);

  const update = {
    rating,
    title,
    comment,
    photos,
    userId: req.user._id,
    productId: pid
  };

  const review = await Review.findOneAndUpdate(
    { productId: pid, userId: req.user._id },
    { $set: update },
    { new: true, upsert: true }
  ).populate({ path: "userId", select: "name" });

  res.json({ success: true, review });
});

/**
 * POST /reviews/:reviewId/helpful
 * requireAuth (recommended)
 * - prevents multiple votes by same user using helpfulBy
 */
exports.markReviewHelpful = asynchandler(async (req, res) => {
  const reviewId = req.params.reviewId;
  if (!isObjectIdLike(reviewId)) throw new AppError("Invalid review id", 400, "INVALID_ID");
  if (!req.user?._id) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

  const userId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");

  const already = Array.isArray(review.helpfulBy) && review.helpfulBy.some((x) => String(x) === String(userId));
  if (already) {
    return res.json({ success: true, helpfulCount: review.helpfulCount || 0, already: true });
  }

  review.helpfulBy = Array.isArray(review.helpfulBy) ? review.helpfulBy : [];
  review.helpfulBy.push(userId);
  review.helpfulCount = Number(review.helpfulCount || 0) + 1;

  await review.save();

  res.json({ success: true, helpfulCount: review.helpfulCount, already: false });
});
