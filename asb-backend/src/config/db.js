const mongoose = require("mongoose");
const { env } = require("./env");

async function connectDB() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production"
  });

  const { host, name } = mongoose.connection;
  console.log(`✅ MongoDB connected: ${host} / ${name}`);
}

module.exports = { connectDB };
