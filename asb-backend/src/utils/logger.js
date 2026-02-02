function logError(err, req) {
  const base = {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req?.originalUrl,
    method: req?.method
  };

  if (process.env.NODE_ENV !== "production") {
    console.error("❌ ERROR:", base);
    if (err.details) console.error("Details:", err.details);
    if (err.stack) console.error(err.stack);
  } else {
    console.error("❌ ERROR:", base);
  }
}

module.exports = { logError }; // ✅ IMPORTANT
