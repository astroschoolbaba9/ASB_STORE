// backend/validators/admin.validators.js
const { z } = require("zod");

const bool = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return undefined;
}, z.boolean());

// CATEGORY GROUPS
const CATEGORY_GROUPS = ["shop", "remedies", "gifts", "stones"];

const categoryCreateSchema = z.object({
  group: z.enum(CATEGORY_GROUPS).optional().default("shop"),
  sortOrder: z.coerce.number().min(0).optional().default(0),

  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().min(1).max(80),
  isActive: z.coerce.boolean().optional().default(true),
});

// PRODUCT (CREATE)
const productCreateSchema = z.object({
  title: z.string().trim().min(1).max(140),
  slug: z.string().trim().min(1).max(180),
  description: z.string().trim().optional().default(""),
  categoryId: z.string().trim().min(1),

  // ✅ allow up to 4 images
  images: z.array(z.string().trim().min(1)).max(4).optional().default([]),

  price: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0).optional().default(0),
  stock: z.coerce.number().int().min(0).optional().default(0),

  spiritualUse: z.string().optional().default(""),
  careHandling: z.string().optional().default(""),
  shippingReturns: z.string().optional().default(""),

  isActive: z.coerce.boolean().optional().default(true),

  isFeatured: z.coerce.boolean().optional().default(false),
  featuredOrder: z.coerce.number().optional().default(0),
});

// PRODUCT (UPDATE) ✅ NEW
const productUpdateSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  slug: z.string().trim().min(1).max(180).optional(),
  description: z.string().trim().optional(),
  categoryId: z.string().trim().min(1).optional(),

  // ✅ allow up to 4 images on update too
  images: z.array(z.string().trim().min(1)).max(4).optional(),

  price: z.coerce.number().min(0).optional(),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),

  spiritualUse: z.string().optional(),
  careHandling: z.string().optional(),
  shippingReturns: z.string().optional(),

  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  featuredOrder: z.coerce.number().optional(),
});

// COURSE
const lessonSchema = z.object({
  title: z.string().trim().min(1).max(140),
  videoUrl: z.string().trim().optional().default(""),
  durationSec: z.coerce.number().min(0).optional().default(0),
  isFreePreview: z.coerce.boolean().optional().default(false),
});

const COURSE_CATEGORIES = ["General", "Beginner Programs", "Advanced Programs", "Certifications", "Workshops"];

const courseCreateSchema = z.object({
  title: z.string().trim().min(1).max(140),
  slug: z.string().trim().min(1).max(180),
  description: z.string().trim().optional().default(""),
  thumbnail: z.string().trim().optional().default(""),

  category: z.enum(COURSE_CATEGORIES).optional().default("General"),

  price: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0).optional().default(0),

  isActive: z.coerce.boolean().optional().default(true),
  isFeatured: z.coerce.boolean().optional().default(false),
  featuredOrder: z.coerce.number().optional().default(0),

  lessons: z.array(lessonSchema).optional().default([]),
});

module.exports = {
  categoryCreateSchema,
  productCreateSchema,
  productUpdateSchema, // ✅ export
  courseCreateSchema,
};
