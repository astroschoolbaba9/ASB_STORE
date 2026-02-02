const mongoose = require("mongoose");

const PaymentTxSchema = new mongoose.Schema(
  {
    txnid: { type: String, required: true, unique: true, index: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    purpose: { type: String, enum: ["SHOP_ORDER", "COURSE_BUY"], required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },

    payuStatus: { type: String, enum: ["PENDING", "success", "failure"], default: "PENDING" },
    mihpayid: { type: String, default: "" },
    mode: { type: String, default: "" },
    bankcode: { type: String, default: "" },

    lastCallback: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTx", PaymentTxSchema);
