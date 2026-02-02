// validators/order.validators.js
const { z } = require("zod");

const orderItemInput = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(50),

  // optional snapshots / gift fields coming from client cart
  categoryName: z.string().optional().default(""),

  isGift: z.boolean().optional().default(false),
  giftWrap: z.boolean().optional().default(false),
  giftWrapPrice: z.number().min(0).optional().default(0),

  giftOccasion: z.string().max(40).optional().default(""),
  giftMessage: z.string().max(300).optional().default(""),
  recipientName: z.string().max(80).optional().default(""),
  recipientPhone: z.string().max(20).optional().default("")
});

const shippingAddressSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  email: z.string().email().optional().or(z.literal("")).default(""),

  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().or(z.literal("")).default(""),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  pincode: z.string().min(4).max(12),
  landmark: z.string().max(120).optional().or(z.literal("")).default("")
});

const paymentSchema = z.object({
  method: z.enum(["COD", "ONLINE_PENDING"]).optional().default("COD"),
  provider: z.string().optional().default(""),
  transactionId: z.string().optional().default("")
}).optional();

const checkoutSchema = z.object({
  items: z.array(orderItemInput).min(1),
  shippingAddress: shippingAddressSchema,
  notes: z.string().max(500).optional().default(""),

  // optional totals controls (keep defaults)
  discount: z.number().min(0).optional().default(0),
  shipping: z.number().min(0).optional().default(0),

  payment: paymentSchema
});

module.exports = { checkoutSchema };
