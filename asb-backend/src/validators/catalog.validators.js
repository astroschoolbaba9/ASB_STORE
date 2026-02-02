const { z } = require("zod");

const toBool = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).toLowerCase();
  if (["true", "1", "yes"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;
  return undefined;
};

// ✅ empty string -> undefined
const toNumberOrUndef = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const toIntOrUndef = (v) => {
  const n = toNumberOrUndef(v);
  if (n === undefined) return undefined;
  return Math.trunc(n);
};

const productsQuerySchema = z
  .object({
    // ✅ allow group filter
    group: z.enum(["shop", "gifts"]).optional(),

    search: z.string().trim().optional(),
    category: z.string().trim().optional(), // can be categoryId OR categorySlug

    priceMin: z.preprocess(toNumberOrUndef, z.number().min(0).optional()),
    priceMax: z.preprocess(toNumberOrUndef, z.number().min(0).optional()),

    sort: z
      .enum(["newest", "featured", "price_asc", "price_desc", "rating_desc"])
      .optional()
      .default("newest"),

    // ✅ IMPORTANT: empty string won't break these now
    page: z.preprocess(toIntOrUndef, z.number().int().min(1).optional()).default(1),
    limit: z.preprocess(toIntOrUndef, z.number().int().min(1).max(50).optional()).default(12),

    featured: z.preprocess(toBool, z.boolean().optional()),
  })
  .refine(
    (d) => {
      if (d.priceMin != null && d.priceMax != null) return d.priceMin <= d.priceMax;
      return true;
    },
    { message: "priceMin must be <= priceMax" }
  );

module.exports = { productsQuerySchema };
