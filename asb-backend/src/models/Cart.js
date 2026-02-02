const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1, max: 50 },

    // 🎁 Gift options per item
    isGift: { type: Boolean, default: false },
    giftWrap: { type: Boolean, default: false },

    // ✅ ADD THIS (you need it for admin order detail)
    giftOccasion: { type: String, default: "", maxlength: 40 },

    giftMessage: { type: String, default: "", maxlength: 300 },

    recipientName: { type: String, default: "", maxlength: 80 },
    recipientPhone: { type: String, default: "", maxlength: 20 }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: [cartItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
