const AdminAuditLog = require("../models/AdminAuditLog");

function redact(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const clone = Array.isArray(obj) ? [...obj] : { ...obj };

  const SENSITIVE_KEYS = ["password", "passwordHash", "otp", "code", "token", "accessToken", "authorization"];
  for (const k of Object.keys(clone)) {
    if (SENSITIVE_KEYS.includes(String(k).toLowerCase())) {
      clone[k] = "[REDACTED]";
    } else if (typeof clone[k] === "object" && clone[k] !== null) {
      clone[k] = redact(clone[k]);
    }
  }
  return clone;
}

function adminAudit() {
  return (req, res, next) => {
    const start = Date.now();

    // capture error from res.locals if your errorHandler sets it
    let errorMsg = "";

    res.on("finish", async () => {
      try {
        // Only log for authenticated admin calls
        const role = String(req.user?.role || "").toLowerCase();
        if (role !== "admin") return;

        await AdminAuditLog.create({
          adminId: req.user._id,
          method: req.method,
          path: req.originalUrl,

          status: res.statusCode,
          durationMs: Date.now() - start,

          ip: req.ip,
          userAgent: String(req.headers["user-agent"] || ""),

          body: redact(req.body),
          query: redact(req.query),
          params: redact(req.params),

          error: errorMsg,
        });
      } catch {
        // never break the request because of logging
      }
    });

    // If you want to capture errors, you can set res.locals.auditError in errorHandler.
    res.locals.setAuditError = (msg) => {
      errorMsg = String(msg || "");
    };

    next();
  };
}

module.exports = { adminAudit };
