// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },         // snapshot
    price: { type: Number, required: true, min: 0 }, // snapshot (unit)
    mrp: { type: Number, default: 0, min: 0 },       // snapshot
    qty: { type: Number, required: true, min: 1, max: 50 },

    image: { type: String, default: "" },            // snapshot
    categoryName: { type: String, default: "" },     // snapshot

    // Gift snapshot
    isGift: { type: Boolean, default: false },
    giftWrap: { type: Boolean, default: false },

    // ✅ unit snapshot (important)
    giftWrapPrice: { type: Number, default: 0, min: 0 },

    giftOccasion: { type: String, default: "", maxlength: 40 },
    giftMessage: { type: String, default: "", maxlength: 300 },
    recipientName: { type: String, default: "", maxlength: 80 },
    recipientPhone: { type: String, default: "", maxlength: 20 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    /**
     * Keep your existing status enum for PAYMENT status to avoid breaking old logic.
     * We add a separate fulfilmentStatus for order lifecycle (PLACED/SHIPPED etc).
     */
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true
    },

    fulfilmentStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
      index: true
    },

    items: { type: [orderItemSchema], default: [] },

    currency: { type: String, default: "INR" },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },

    giftWrapTotal: { type: Number, default: 0, min: 0 },

    total: { type: Number, required: true, min: 0 },

    shippingAddress: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" }, // ✅ NEW (useful for admin)
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      landmark: { type: String, default: "" }
    },


    // ✅ Tracking (admin managed)
tracking: {
  courier: { type: String, default: "" },
  trackingId: { type: String, default: "" },
  trackingUrl: { type: String, default: "" }
},

// ✅ Status history (audit trail)
statusHistory: {
  type: [
    {
      at: { type: Date, default: Date.now },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin user id
      action: { type: String, default: "" }, // e.g. "FULFILMENT_STATUS_UPDATED"
      note: { type: String, default: "" },

      status: { type: String, default: "" }, // payment status snapshot
      fulfilmentStatus: { type: String, default: "" } // fulfilment snapshot
    }
  ],
  default: []
},

    // ✅ Payment details placeholder (NO PAYMENT YET)
    payment: {
      method: { type: String, default: "COD" }, // "COD" or "ONLINE_PENDING"
      status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING", index: true },
      provider: { type: String, default: "" }, // later: "razorpay"
      transactionId: { type: String, default: "" }, // later
      paidAt: { type: Date }
    },

    notes: { type: String, default: "", maxlength: 500 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
