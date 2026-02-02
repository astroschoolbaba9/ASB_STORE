const { z } = require("zod");

const addItemSchema = z.object({
  productId: z.string().trim().min(1),
  qty: z.coerce.number().int().min(1).max(50).default(1),

  isGift: z.coerce.boolean().optional().default(false),
  giftWrap: z.coerce.boolean().optional().default(false),
  giftMessage: z.string().trim().max(300).optional().default(""),

  recipientName: z.string().trim().max(80).optional().default(""),
  recipientPhone: z.string().trim().max(20).optional().default("")
});

const updateItemSchema = z.object({
  qty: z.coerce.number().int().min(1).max(50).optional(),

  isGift: z.coerce.boolean().optional(),
  giftWrap: z.coerce.boolean().optional(),
  giftMessage: z.string().trim().max(300).optional(),

  recipientName: z.string().trim().max(80).optional(),
  recipientPhone: z.string().trim().max(20).optional()
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field must be provided" });

module.exports = { addItemSchema, updateItemSchema };
