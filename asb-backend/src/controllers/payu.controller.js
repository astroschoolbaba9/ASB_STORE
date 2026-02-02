const { asyncHandler } = require("../utils/asynchandler");
const { AppError } = require("../utils/AppError");
const PaymentTx = require("../models/PaymentTx");
const Order = require("../models/Order");
const Course = require("../models/Course");
const orderService = require("../services/order.service");
const courseService = require("../services/course.service");
const { makePayuRequestHash, makePayuResponseHash } = require("../utils/payuhash");

function payuActionUrl() {
  return (process.env.PAYU_ENV || "test") === "live"
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";
}

function makeTxnId() {
  return `ASB${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

const initiate = asyncHandler(async (req, res) => {
  const { purpose, orderId, courseId, customer } = req.body || {};

  if (!["SHOP_ORDER", "COURSE_BUY"].includes(purpose)) {
    throw new AppError("Invalid purpose", 400, "VALIDATION_ERROR");
  }

  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  if (!key || !salt) throw new AppError("PayU not configured", 500, "PAYU_NOT_CONFIGURED");

 const BACKEND = "http://localhost:8080"; // or your ngrok backend URL

const surl = `${BACKEND}/api/payments/payu/success`;
const furl = `${BACKEND}/api/payments/payu/fail`;

  if (!surl || !furl) {
    throw new AppError("PayU callback URLs missing", 500, "PAYU_URLS_MISSING", {
      needed: ["PAYU_SUCCESS_URL", "PAYU_FAIL_URL"]
    });
  }

  const user = req.user;

  let amount = 0;
  let productinfo = "";
  let refOrderId = "";
  let refCourseId = "";

  // ✅ Start from user, then allow "customer" overrides (useful for COURSE too)
  let firstname = String(customer?.firstname || user?.name || "Customer");
  let email = String(customer?.email || user?.email || "");
  let phone = String(customer?.phone || user?.phone || "");

  console.log("[PAYU INIT] incoming:", { purpose, orderId, courseId });
  console.log("[PAYU INIT] user:", { id: String(user?._id || ""), email: user?.email, phone: user?.phone });

  if (purpose === "SHOP_ORDER") {
    if (!orderId) throw new AppError("orderId required", 400, "VALIDATION_ERROR");

    const order = await Order.findOne({ _id: orderId, userId: user._id });
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

    if (String(order.status || "").toUpperCase() === "PAID") {
      throw new AppError("Order already paid", 400, "ALREADY_PAID");
    }

    // ✅ fallback from order shipping address
    const shipEmail = String(order?.shippingAddress?.email || "");
    const shipPhone = String(order?.shippingAddress?.phone || "");
    const shipName = String(order?.shippingAddress?.fullName || "");

    console.log("[PAYU INIT] order shipping:", { shipEmail, shipPhone, shipName });

    if (!email && shipEmail) email = shipEmail;
    if (!phone && shipPhone) phone = shipPhone;
    if (!firstname && shipName) firstname = shipName;

    amount = Number(order.total || 0);
    if (amount <= 0) throw new AppError("Invalid order amount", 400, "INVALID_AMOUNT");

    productinfo = `ASB Shop Order ${order._id}`;
    refOrderId = String(order._id);

    // mark intent
    order.payment = order.payment || {};
    order.payment.method = "ONLINE_PENDING";
    order.payment.status = "PENDING";
    order.payment.provider = "PAYU";
    await order.save();
  }

  if (purpose === "COURSE_BUY") {
    if (!courseId) throw new AppError("courseId required", 400, "VALIDATION_ERROR");

    const course = await Course.findOne({ _id: courseId, isActive: true }).select("price title");
    if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");

    amount = Number(course.price || 0);
    if (amount <= 0) throw new AppError("Course is free, no payment needed", 400, "NO_PAYMENT_NEEDED");

    productinfo = `ASB Course ${course._id}`;
    refCourseId = String(course._id);
  }

  console.log("[PAYU INIT] final customer:", { firstname, email, phone });

  // ✅ validate AFTER fallback
  if (!email) throw new AppError("Email required for online payment", 400, "EMAIL_REQUIRED");
  if (!phone) throw new AppError("Phone required for online payment", 400, "PHONE_REQUIRED");

  const txnid = makeTxnId();
  const amountStr = Number(amount).toFixed(2);

  const udf1 = purpose;
  const udf2 = refOrderId;
  const udf3 = refCourseId;
  const udf4 = String(user._id);
  const udf5 = "";

  const hash = makePayuRequestHash({
    key,
    salt,
    txnid,
    amount: amountStr,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5
  });

  await PaymentTx.create({
    txnid,
    userId: user._id,
    purpose,
    orderId: refOrderId || undefined,
    courseId: refCourseId || undefined,
    amount,
    currency: "INR",
    payuStatus: "PENDING"
  });

  res.json({
    success: true,
    actionUrl: payuActionUrl(),
    fields: {
      key,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      hash
    }
  });
});

const success = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const {
    status,
    txnid,
    key,
    hash,
    email,
    firstname,
    productinfo,
    amount,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    mihpayid,
    mode,
    bankcode
  } = body;

  const salt = process.env.PAYU_SALT;

  const verify = makePayuResponseHash({
    salt,
    status,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key
  });

  if (String(verify).toLowerCase() !== String(hash).toLowerCase()) {
    throw new AppError("Invalid PayU response hash", 400, "PAYU_HASH_MISMATCH", { txnid });
  }

  const tx = await PaymentTx.findOne({ txnid });
  if (!tx) throw new AppError("Unknown txnid", 404, "PAYU_TX_NOT_FOUND");

  tx.payuStatus = "success";
  tx.mihpayid = String(mihpayid || "");
  tx.mode = String(mode || "");
  tx.bankcode = String(bankcode || "");
  tx.lastCallback = body;
  await tx.save();

  const purpose = String(udf1 || "");
  const orderId = String(udf2 || "");
  const courseId = String(udf3 || "");
  const userId = String(tx.userId);

  if (purpose === "SHOP_ORDER" && orderId) {
    await orderService.markOrderPaid(userId, orderId, { provider: "PAYU", txnid, mihpayid });
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/payment/success?purpose=shop&orderId=${encodeURIComponent(orderId)}`
    );
  }

  if (purpose === "COURSE_BUY" && courseId) {
    await courseService.confirmCoursePayment(userId, courseId, { provider: "PAYU", txnid, mihpayid });
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/payment/success?purpose=course&courseId=${encodeURIComponent(courseId)}`
    );
  }

  return res.redirect(`${process.env.FRONTEND_BASE_URL}/payment/success?txnid=${encodeURIComponent(txnid)}`);
});

const fail = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { txnid, udf1, udf2, udf3, mihpayid } = body;

  const tx = await PaymentTx.findOne({ txnid });
  if (tx) {
    tx.payuStatus = "failure";
    tx.mihpayid = String(mihpayid || "");
    tx.lastCallback = body;
    await tx.save();
  }

  const purpose = String(udf1 || "");
  const orderId = String(udf2 || "");
  const courseId = String(udf3 || "");
  const userId = tx ? String(tx.userId) : "";

  if (purpose === "SHOP_ORDER" && orderId) {
    if (userId) {
      await orderService.markOrderFailed(userId, orderId, { provider: "PAYU", txnid, mihpayid });
    }
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/payment/failed?purpose=shop&orderId=${encodeURIComponent(orderId)}`
    );
  }

  if (purpose === "COURSE_BUY" && courseId) {
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/payment/failed?purpose=course&courseId=${encodeURIComponent(courseId)}`
    );
  }

  return res.redirect(`${process.env.FRONTEND_BASE_URL}/payment/failed?txnid=${encodeURIComponent(txnid || "")}`);
});

module.exports = { initiate, success, fail };
