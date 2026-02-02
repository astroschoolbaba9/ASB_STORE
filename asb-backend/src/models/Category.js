const mongoose = require("mongoose");

// ✅ allow legacy groups so old DB data never breaks validation
const CATEGORY_GROUPS = ["shop", "gifts", "remedies", "stones", "services"];

const categorySchema = new mongoose.Schema(
  {
    group: {
      type: String,
      enum: CATEGORY_GROUPS,
      default: "shop",
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },

    sortOrder: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ group: 1, sortOrder: 1, name: 1 });

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);
