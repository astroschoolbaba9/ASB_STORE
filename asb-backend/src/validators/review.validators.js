const { z } = require("zod");

const createReviewSchema = z.object({
  productId: z.string().trim().optional(),
  courseId: z.string().trim().optional(),

  rating: z.coerce.number().min(1).max(5),
  title: z.string().trim().max(80).optional().default(""),
  comment: z.string().trim().max(500).optional().default("")
}).refine((d) => {
  const hasProduct = !!d.productId;
  const hasCourse = !!d.courseId;
  return (hasProduct && !hasCourse) || (!hasProduct && hasCourse);
}, { message: "Provide exactly one of productId or courseId" });

const listReviewQuerySchema = z.object({
  productId: z.string().trim().optional(),
  courseId: z.string().trim().optional()
}).refine((d) => {
  const hasProduct = !!d.productId;
  const hasCourse = !!d.courseId;
  return (hasProduct && !hasCourse) || (!hasProduct && hasCourse);
}, { message: "Provide exactly one of productId or courseId" });

module.exports = { createReviewSchema, listReviewQuerySchema };
