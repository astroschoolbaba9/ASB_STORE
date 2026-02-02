const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, trim: true, lowercase: true },

    description: { type: String, default: "" },

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    images: [{ type: String }], // store URLs/paths (your UI can render)

    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: 0, min: 0 },
    spiritualUse: { type: String, default: "" },
    careHandling: { type: String, default: "" },
    shippingReturns: { type: String, default: "" },

    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0, min: 0 },

    // Reviews summary (STEP 8 updates these)
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 }, { unique: true });
// search index (simple). For better search later, we can switch to Atlas Search.
productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
