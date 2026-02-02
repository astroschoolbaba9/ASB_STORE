const { AppError } = require("../utils/AppError");

function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }
  if (req.user.role !== "admin") {
    return next(new AppError("Admin access only", 403, "FORBIDDEN"));
  }
  next();
}

module.exports = { requireAdmin };
