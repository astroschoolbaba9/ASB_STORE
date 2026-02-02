const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const adminOrderController = require("../controllers/admin.order.controller");
const adminGiftController = require("../controllers/admin.gift.controller");

const { requireAuth, requireAdmin } = require("../middleware/auth");
const { adminAudit } = require("../middleware/adminAudit"); // ✅ NEW

// ✅ protect + audit ALL admin routes here
router.use(requireAuth, requireAdmin, adminAudit());

// CATEGORY
router.post("/categories", adminController.createCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// PRODUCT
router.post("/products", adminController.createProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);

// COURSE
router.post("/courses", adminController.createCourse);
router.put("/courses/:id", adminController.updateCourse);
router.delete("/courses/:id", adminController.deleteCourse);

// ORDERS
router.get("/orders", adminOrderController.listOrders);
router.get("/orders/:id", adminOrderController.getOrderById);
router.patch("/orders/:id/fulfilment", adminOrderController.updateFulfilmentStatus);
router.patch("/orders/:id/tracking", adminOrderController.updateTracking);

// DASHBOARD STATS
router.get("/dashboard-stats", adminController.getDashboardStats);

// GIFT CONFIG
router.get("/gift-config", adminGiftController.getGiftConfig);
router.put("/gift-config", adminGiftController.updateGiftConfig);

// banner routes
router.use(require("./admin.banner.routes"));

// uploads
router.use(require("./admin.upload.routes"));

router.use(require("./admin.audit.routes"));


module.exports = router;
