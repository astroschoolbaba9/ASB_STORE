const { z } = require("zod");

const toBool = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).toLowerCase();
  if (["true", "1", "yes"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;
  return undefined;
};

const coursesQuerySchema = z.object({
  search: z.string().trim().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating_desc"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),

  // ✅ NEW
  featured: z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const s = String(v).toLowerCase();
    if (["true", "1", "yes", "on"].includes(s)) return true;
    if (["false", "0", "no", "off"].includes(s)) return false;
    return undefined;
  }, z.boolean().optional()),
});

module.exports = { coursesQuerySchema };
