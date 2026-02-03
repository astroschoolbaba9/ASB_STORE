const { asynchandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const adminService = require("../services/admin.service");

const {
  categoryCreateSchema,
  productCreateSchema,
  productUpdateSchema, // ✅ NEW
  courseCreateSchema
} = require("../validators/admin.validators");

// CATEGORY
const createCategory = asynchandler(async (req, res) => {
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const category = await adminService.createCategory(parsed.data);
  res.status(201).json({ success: true, category });
});

const updateCategory = asynchandler(async (req, res) => {
  const category = await adminService.updateCategory(req.params.id, req.body || {});
  res.json({ success: true, category });
});

const deleteCategory = asynchandler(async (req, res) => {
  await adminService.deleteCategory(req.params.id);
  res.json({ success: true });
});

// PRODUCT
const createProduct = asynchandler(async (req, res) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const product = await adminService.createProduct(parsed.data);
  res.status(201).json({ success: true, product });
});

const updateProduct = asynchandler(async (req, res) => {
  // ✅ validate update too
  const parsed = productUpdateSchema.safeParse(req.body || {});
  if (!parsed.success)
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const product = await adminService.updateProduct(req.params.id, parsed.data);
  res.json({ success: true, product });
});

const deleteProduct = asynchandler(async (req, res) => {
  await adminService.deleteProduct(req.params.id);
  res.json({ success: true });
});

// COURSE
const createCourse = asynchandler(async (req, res) => {
  const parsed = courseCreateSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const course = await adminService.createCourse(parsed.data);
  res.status(201).json({ success: true, course });
});

const updateCourse = asynchandler(async (req, res) => {
  const course = await adminService.updateCourse(req.params.id, req.body || {});
  res.json({ success: true, course });
});

const deleteCourse = asynchandler(async (req, res) => {
  await adminService.deleteCourse(req.params.id);
  res.json({ success: true });
});

// DASHBOARD STATS
const getDashboardStats = asynchandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, stats });
});

module.exports = {
  getDashboardStats,

  // category
  createCategory,
  updateCategory,
  deleteCategory,

  // product
  createProduct,
  updateProduct,
  deleteProduct,

  // course
  createCourse,
  updateCourse,
  deleteCourse
};
