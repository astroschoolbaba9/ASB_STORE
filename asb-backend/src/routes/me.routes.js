// routes/me.routes.js
const express = require("express");
const router = express.Router();

const meController = require("../controllers/me.controller");
const { requireAuth } = require("../middleware/auth");

// everything here is logged-in
router.use(requireAuth);

// profile
router.get("/", meController.getMe);
router.put("/", meController.updateMe);

// addresses
router.get("/addresses", meController.listAddresses);
router.post("/addresses", meController.addAddress);
router.put("/addresses/:id", meController.updateAddress);
router.delete("/addresses/:id", meController.deleteAddress);
router.patch("/addresses/:id/default", meController.setDefaultAddress);

module.exports = router;
