const Course = require("../models/Course");
const CourseEnrollment = require("../models/CourseEnrollment");
const PaymentTx = require("../models/PaymentTx");
const { AppError } = require("../utils/AppError");
const { makePayuRequestHash } = require("../utils/payuHash");

function payuActionUrl() {
  return (process.env.PAYU_ENV || "test") === "live"
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";
}

function makeTxnId() {
  return `ASB${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function addOneYear(from = new Date()) {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

async function hasActiveEnrollment(userId, courseId) {
  const now = new Date();
  const enr = await CourseEnrollment.findOne({ userId, courseId });
  if (!enr) return { ok: false, enr: null };
  if (enr.status === "ACTIVE" && enr.expiresAt && enr.expiresAt > now) return { ok: true, enr };
  // auto-expire if past
  if (enr.status !== "EXPIRED" && enr.expiresAt && enr.expiresAt <= now) {
    enr.status = "EXPIRED";
    await enr.save().catch(() => {});
  }
  return { ok: false, enr };
}

async function listCourses(q = {}) {
  const page = Math.max(1, Number(q.page || 1));
  const limit = Math.min(50, Math.max(1, Number(q.limit || 12)));

  const filter = { isActive: true };

  if (q.category) filter.category = String(q.category);
  if (q.featured === true || q.featured === "true") filter.isFeatured = true;

  if (q.search) {
    const s = String(q.search).trim();
    if (s) filter.$text = { $search: s };
  }

  const total = await Course.countDocuments(filter);
  const items = await Course.find(filter)
    .sort(q.search ? { score: { $meta: "textScore" } } : { featuredOrder: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("_id title slug description thumbnail category price mrp isFeatured featuredOrder ratingAvg ratingCount lessons createdAt");

  return { page, limit, total, pages: Math.ceil(total / limit), items };
}

async function getCourseById(id) {
  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");
  return course;
}

/**
 * BUY COURSE:
 * - if already enrolled => return { alreadyPurchased: true }
 * - if free => create enrollment, return { purchased: true, free: true }
 * - else => return payu form fields { paymentRequired: true, actionUrl, fields }
 */
async function buyCourse(userId, courseId) {
  const course = await Course.findOne({ _id: courseId, isActive: true }).select("title price");
  if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");

  const access = await hasActiveEnrollment(userId, courseId);
  if (access.ok) {
    return { alreadyPurchased: true, purchased: true, courseId: String(courseId) };
  }

  const price = Number(course.price || 0);
  if (price <= 0) {
    await CourseEnrollment.findOneAndUpdate(
      { userId, courseId },
      {
        userId,
        courseId,
        status: "ACTIVE",
        purchasedAt: new Date(),
        expiresAt: addOneYear(new Date()),
      },
      { upsert: true, new: true }
    );
    return { purchased: true, free: true, courseId: String(courseId) };
  }

  // PAYU required
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  if (!key || !salt) throw new AppError("PayU not configured", 500, "PAYU_NOT_CONFIGURED");

  const surl = process.env.PAYU_SUCCESS_URL;
  const furl = process.env.PAYU_FAIL_URL;
  if (!surl || !furl) {
    throw new AppError("PayU callback URLs missing", 500, "PAYU_URLS_MISSING", {
      needed: ["PAYU_SUCCESS_URL", "PAYU_FAIL_URL"],
    });
  }

  // IMPORTANT: PayU needs firstname/email/phone.
  // Your auth stores user in req.user, but here we only have userId.
  // We’ll store userId in udf4, and frontend will send customer info as overrides if needed.
  // EASIEST: We’ll use dummy values; but better: pass in customer from controller.
  throw new AppError(
    "Customer details missing for PayU. Use controller wrapper that passes firstname/email/phone.",
    500,
    "PAYU_CUSTOMER_MISSING"
  );
}

/**
 * Initiate PayU for course with customer data (this is what controller should call)
 */
async function buyCourseWithPayU(user, courseId, customerOverride = {}) {
  const course = await Course.findOne({ _id: courseId, isActive: true }).select("title price");
  if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");

  const access = await hasActiveEnrollment(user._id, courseId);
  if (access.ok) {
    return { alreadyPurchased: true, purchased: true, courseId: String(courseId) };
  }

  const price = Number(course.price || 0);
  if (price <= 0) {
    await CourseEnrollment.findOneAndUpdate(
      { userId: user._id, courseId },
      {
        userId: user._id,
        courseId,
        status: "ACTIVE",
        purchasedAt: new Date(),
        expiresAt: addOneYear(new Date()),
      },
      { upsert: true, new: true }
    );
    return { purchased: true, free: true, courseId: String(courseId) };
  }

  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  if (!key || !salt) throw new AppError("PayU not configured", 500, "PAYU_NOT_CONFIGURED");

  const surl = process.env.PAYU_SUCCESS_URL;
  const furl = process.env.PAYU_FAIL_URL;
  if (!surl || !furl) {
    throw new AppError("PayU callback URLs missing", 500, "PAYU_URLS_MISSING", {
      needed: ["PAYU_SUCCESS_URL", "PAYU_FAIL_URL"],
    });
  }

  // customer
  const firstname = String(customerOverride.firstname || user?.name || "Customer");
  const email = String(customerOverride.email || user?.email || "");
  const phone = String(customerOverride.phone || user?.phone || "");

  if (!email) throw new AppError("Email required for online payment", 400, "EMAIL_REQUIRED");
  if (!phone) throw new AppError("Phone required for online payment", 400, "PHONE_REQUIRED");

  const txnid = makeTxnId();
  const amountStr = Number(price).toFixed(2);
  const productinfo = `ASB Course ${course._id}`;

  // UDF mapping used in your payu.controller success:
  const udf1 = "COURSE_BUY";
  const udf2 = ""; // orderId
  const udf3 = String(course._id); // courseId
  const udf4 = String(user._id);   // userId
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
    udf5,
  });

  await PaymentTx.create({
    txnid,
    userId: user._id,
    purpose: "COURSE_BUY",
    courseId: String(course._id),
    amount: price,
    currency: "INR",
    payuStatus: "PENDING",
  });

  return {
    paymentRequired: true,
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
      hash,
    },
  };
}

/**
 * Called from PayU success callback
 * Creates/updates enrollment with 1 year expiry.
 */
async function confirmCoursePayment(userId, courseId, pay = {}) {
  const course = await Course.findById(courseId).select("price title");
  if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");

  const expiresAt = addOneYear(new Date());

  await CourseEnrollment.findOneAndUpdate(
    { userId, courseId },
    {
      userId,
      courseId,
      status: "ACTIVE",
      purchasedAt: new Date(),
      expiresAt,
      payment: {
        provider: String(pay.provider || "PAYU"),
        txnid: String(pay.txnid || ""),
        mihpayid: String(pay.mihpayid || ""),
        amount: Number(course.price || 0),
        currency: "INR",
        paidAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return { purchased: true, courseId: String(courseId), expiresAt };
}

/**
 * Course content gating:
 * - If purchased => all lessons with videoUrl
 * - If not purchased but previews exist => previewOnly + only preview lessons
 * - Else => 403 COURSE_NOT_PURCHASED
 */
async function getCourseContent(userId, courseId) {
  const course = await Course.findOne({ _id: courseId, isActive: true }).lean();
  if (!course) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");

  const access = await hasActiveEnrollment(userId, courseId);
  if (access.ok) {
    return {
      title: course.title,
      lessons: course.lessons || [],
      purchased: true,
      previewOnly: false,
      price: Number(course.price || 0),
      expiresAt: access.enr?.expiresAt,
    };
  }

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const previews = lessons.filter((l) => l && l.isFreePreview);

  if (previews.length > 0) {
    return {
      title: course.title,
      lessons: previews,
      purchased: false,
      previewOnly: true,
      price: Number(course.price || 0),
    };
  }

  throw new AppError("Course not purchased", 403, "COURSE_NOT_PURCHASED", {
    courseId: String(courseId),
  });
}

async function getMyCourses(userId) {
  const now = new Date();
  const enrollments = await CourseEnrollment.find({ userId }).sort({ createdAt: -1 }).lean();

  const courseIds = enrollments.map((e) => e.courseId);
  const courses = await Course.find({ _id: { $in: courseIds } })
    .select("_id title slug thumbnail category price lessons ratingAvg ratingCount")
    .lean();

  const byId = new Map(courses.map((c) => [String(c._id), c]));

  return enrollments
    .map((e) => {
      const c = byId.get(String(e.courseId));
      if (!c) return null;
      const isActive = e.status === "ACTIVE" && e.expiresAt && new Date(e.expiresAt) > now;
      return {
        enrollment: {
          status: isActive ? "ACTIVE" : "EXPIRED",
          purchasedAt: e.purchasedAt,
          expiresAt: e.expiresAt,
        },
        course: c,
      };
    })
    .filter(Boolean);
}

module.exports = {
  listCourses,
  getCourseById,
  buyCourse, // not used now (kept)
  buyCourseWithPayU,
  confirmCoursePayment,
  getCourseContent,
  getMyCourses,
};
