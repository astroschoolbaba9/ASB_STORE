const express = require("express");
const router = express.Router();

const catalogController = require("../controllers/catalog.controller");

router.get("/categories", catalogController.getCategories);
router.get("/categories/grouped", catalogController.getCategoriesGrouped);

router.get("/products", catalogController.getProducts);
router.get("/products/:id", catalogController.getProductById);

module.exports = router;
