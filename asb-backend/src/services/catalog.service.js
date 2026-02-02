const Product = require("../models/Product");
const Category = require("../models/Category");
const { AppError } = require("../utils/AppError");

function isObjectIdLike(v) {
  return typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);
}

async function listCategories({ group } = {}) {
  const filter = { isActive: true };
  if (group) filter.group = String(group).toLowerCase();

  const categories = await Category.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return categories;
}

async function listCategoriesGrouped() {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

  const grouped = { shop: [], gifts: [] };
  for (const c of categories) {
    const g = String(c.group || "shop").toLowerCase();
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(c);
  }
  return grouped;
}

async function resolveCategoryIds({ group, category }) {
  let categoryDoc = null;

  if (category) {
    // category can be ID or slug
    if (isObjectIdLike(category)) categoryDoc = await Category.findById(category).lean();
    if (!categoryDoc) categoryDoc = await Category.findOne({ slug: String(category).toLowerCase() }).lean();

    if (!categoryDoc) return { categoryIds: [], categoryDoc: null };

    // if group also provided, ensure category belongs to that group
    if (group && String(categoryDoc.group).toLowerCase() !== String(group).toLowerCase()) {
      return { categoryIds: [], categoryDoc };
    }

    return { categoryIds: [categoryDoc._id], categoryDoc };
  }

  if (group) {
    const cats = await Category.find({ group: String(group).toLowerCase(), isActive: true })
      .select("_id")
      .lean();
    return { categoryIds: cats.map((c) => c._id), categoryDoc: null };
  }

  return { categoryIds: null, categoryDoc: null }; // null means "no filter"
}

async function listProducts(q) {
  const {
    group,
    search,
    category,
    priceMin,
    priceMax,
    sort,
    page = 1,
    limit = 12,
    featured,
  } = q || {};

  const filter = { isActive: true };

  // ✅ group/category filtering via Category
  const { categoryIds } = await resolveCategoryIds({ group, category });
  if (Array.isArray(categoryIds)) {
    if (categoryIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }
    filter.categoryId = { $in: categoryIds };
  }

  if (featured === true) filter.isFeatured = true;

  if (priceMin != null || priceMax != null) {
    filter.price = {};
    if (priceMin != null) filter.price.$gte = priceMin;
    if (priceMax != null) filter.price.$lte = priceMax;
  }

  // search (text index on Product)
  const searchTrim = String(search || "").trim();
  if (searchTrim) {
    filter.$text = { $search: searchTrim };
  }

  // sorting
  let sortObj = { createdAt: -1 };
  if (sort === "price_asc") sortObj = { price: 1, createdAt: -1 };
  if (sort === "price_desc") sortObj = { price: -1, createdAt: -1 };
  if (sort === "rating_desc") sortObj = { ratingAvg: -1, ratingCount: -1, createdAt: -1 };
  if (sort === "featured") sortObj = { isFeatured: -1, featuredOrder: 1, createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate("categoryId", "name slug group sortOrder isActive")
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
}

async function getProductById(id) {
  const product = await Product.findById(id)
    .populate("categoryId", "name slug group sortOrder isActive")
    .lean();

  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  return product;
}

module.exports = {
  listCategories,
  listCategoriesGrouped,
  listProducts,
  getProductById,
};
