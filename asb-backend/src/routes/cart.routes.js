// routes/cart.routes.js
const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");
const { requireAuth } = require("../middleware/auth");

// ✅ protect all cart routes once
router.use(requireAuth);

// Base path is /api/cart (mounted in app.js)
router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.put("/items/:itemId", cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);

module.exports = router;
