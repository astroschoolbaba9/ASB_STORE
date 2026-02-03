const { asynchandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const catalogService = require("../services/catalog.service");
const { productsQuerySchema } = require("../validators/catalog.validators");

const getCategories = asynchandler(async (req, res) => {
  const group = req.query?.group; // ✅ allow /api/categories?group=remedies
  const categories = await catalogService.listCategories({ group });
  res.json({ success: true, categories });
});

const getCategoriesGrouped = asynchandler(async (req, res) => {
  const grouped = await catalogService.listCategoriesGrouped();
  res.json({ success: true, grouped });
});

const getProducts = asynchandler(async (req, res) => {
  const parsed = productsQuerySchema.safeParse(req.query);
  if (!parsed.success)
    throw new AppError("Invalid query params", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const result = await catalogService.listProducts(parsed.data);
  res.json({ success: true, ...result });
});

const getProductById = asynchandler(async (req, res) => {
  const product = await catalogService.getProductById(req.params.id);
  res.json({ success: true, product });
});

module.exports = { getCategories, getCategoriesGrouped, getProducts, getProductById };
