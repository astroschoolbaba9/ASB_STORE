// asb-backend/src/routes/notification.routes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.use(requireAuth);

router.get("/", notificationController.listMyNotifications);
router.patch("/:id/read", notificationController.markRead);
router.post("/admin/broadcast", requireAdmin, notificationController.adminSendBroadcast);

module.exports = router;
