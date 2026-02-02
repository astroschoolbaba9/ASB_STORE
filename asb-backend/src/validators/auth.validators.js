const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(6).max(72)
}).refine((d) => d.email || d.phone, { message: "email or phone is required" });

const loginSchema = z.object({
  identifier: z.string().trim().min(3), // email or phone
  password: z.string().min(6).max(72)
});

module.exports = { registerSchema, loginSchema };
