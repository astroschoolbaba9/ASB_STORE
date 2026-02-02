const express = require("express");
const router = express.Router();

const payuController = require("../controllers/payu.controller");
const { requireAuth } = require("../middleware/auth");

// create payment intent (authenticated)
router.post("/initiate", requireAuth, payuController.initiate);

// callbacks (must be PUBLIC; PayU will POST here)
router.post("/success", payuController.success);
router.post("/fail", payuController.fail);

module.exports = router;
