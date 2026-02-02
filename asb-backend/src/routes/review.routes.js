const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const { requireAuth } = require("../middleware/auth");

// ONLY under /products and /reviews — never generic paths
router.get("/products/:id/reviews", reviewController.getProductReviews);
router.post("/products/:id/reviews", requireAuth, reviewController.upsertProductReview);
router.post("/reviews/:reviewId/helpful", requireAuth, reviewController.markReviewHelpful);

module.exports = router;
