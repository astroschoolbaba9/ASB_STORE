const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },

    line1: { type: String, default: "" },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    landmark: { type: String, default: "" },

    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },

    name: { type: String, default: "", trim: true },

    // ✅ IMPORTANT: do NOT default to null, or you'll get duplicate key for null
    email: { type: String, default: undefined, trim: true, lowercase: true },
    phone: { type: String, default: undefined, trim: true },

    addresses: { type: [addressSchema], default: [] },

    passwordHash: { type: String, default: null },

    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Unique only when field exists and is a string
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
