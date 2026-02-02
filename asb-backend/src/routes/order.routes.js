const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth");

// protect all order routes once
router.use(requireAuth);

router.post("/checkout", orderController.checkout);
router.get("/", orderController.listMyOrders);
router.get("/:id", orderController.getMyOrderById);

module.exports = router;
