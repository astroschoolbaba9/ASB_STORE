// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");
const path = require("path");

const catalogRoutes = require("./routes/catalog.routes");
const cartRoutes = require("./routes/cart.routes");
const courseRoutes = require("./routes/course.routes");
const reviewRoutes = require("./routes/review.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");

const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");

// Contact routes
const contactRoutes = require("./routes/contact.routes");
const adminContactRoutes = require("./routes/admin.contact.routes");

const { env } = require("./config/env");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  // If behind Nginx/Cloudflare
  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // ================= CORS (VPS PRODUCTION SAFE) =================
  const corsOptions = {
    origin: (origin, cb) => {
      // allow server-to-server (curl, Postman without origin)
      // allow PayU simulation (Origin: null)
      if (!origin || origin === "null") return cb(null, true);

      const isAllowed = env.CORS_ORIGIN.some(o => {
        try {
          const allowedHost = new URL(o).hostname;
          const currentHost = new URL(origin).hostname;
          return allowedHost === currentHost;
        } catch (e) {
          return o === origin;
        }
      });

      if (isAllowed) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));
  // IMPORTANT: preflight must use the SAME config
  app.options("*", cors(corsOptions));
  // =============================================================

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MIN * 60 * 1000,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many requests",
    },
    skip: (req) => req.method === "OPTIONS",
  });
  app.use("/api", limiter);

  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.use(
    "/uploads",
    (req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(path.join(__dirname, "uploads"))
  );

  // ================= ROUTES =================

  // Public
  app.use("/api", healthRoutes);
  app.use("/api/auth", authRoutes);

  app.use("/api/gift-config", require("./routes/gift.routes"));
  app.use("/api", require("./routes/banner.routes"));
  app.use("/api", require("./routes/banner.public.routes"));

  // Contact
  app.use("/api", contactRoutes);

  // Public catalog / courses / reviews
  app.use("/api", catalogRoutes);
  app.use("/api", courseRoutes);
  app.use("/api", reviewRoutes);
  app.use("/api/payments/payu", require("./routes/payu.routes"));

  // Protected user routes
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/me", require("./routes/me.routes"));

  // Protected admin routes
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", adminContactRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

