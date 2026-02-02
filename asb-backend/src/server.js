const { createApp } = require("./app");
const { connectDB } = require("./config/db");
const { env } = require("./config/env");

async function start() {
  await connectDB();

  const app = createApp();

const PORT = env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} (${env.NODE_ENV})`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
});

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("🛑 SIGINT received, shutting down...");
    server.close(() => process.exit(0));
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
