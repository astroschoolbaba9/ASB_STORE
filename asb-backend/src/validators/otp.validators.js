const { z } = require("zod");

const identifierSchema = z.string().trim().min(3, "identifier is required");

const otpValueSchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^[0-9]{4,8}$/.test(v), "otp must be 4-8 digits");

const sendOtpSchema = z.object({ identifier: identifierSchema });

const verifyOtpSchema = z
  .object({
    identifier: identifierSchema,
    otp: otpValueSchema.optional(),
    code: otpValueSchema.optional(),
  })
  .transform((d) => ({ identifier: d.identifier, otp: d.otp ?? d.code }))
  .refine((d) => !!d.otp, { message: "otp is required" });

module.exports = { sendOtpSchema, verifyOtpSchema };
