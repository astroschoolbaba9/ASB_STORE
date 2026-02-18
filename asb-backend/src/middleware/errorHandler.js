const { AppError } = require("../utils/AppError");
const { logError } = require("../utils/logger");
const { env } = require("../config/env");


function errorHandler(err, req, res, next) {
  if (err?.name === "CastError") {
    err = new AppError("Invalid ID format", 400, "INVALID_ID", { value: err.value, path: err.path });
  }

  if (res.locals?.setAuditError) {
    res.locals.setAuditError(err?.message || "Error");
  }


  if (err?.code === 11000) {
    err = new AppError("Duplicate key error", 409, "DUPLICATE_KEY", { keyValue: err.keyValue });
  }

  if (err?.name === "ValidationError") {
    err = new AppError("Validation error", 400, "VALIDATION_ERROR", { errors: err.errors });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";

  logError(err, req);

  const isProd = env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    code,
    // Hide details in production. Only show message if it's a 4xx error or not production
    message: (isProd && statusCode === 500) ? "Internal Server Error" : (err.message || "Something went wrong"),
    details: isProd ? null : (err.details || null)
  });
}


module.exports = { errorHandler }; // ✅ IMPORTANT
