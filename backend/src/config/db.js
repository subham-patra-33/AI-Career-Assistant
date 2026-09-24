const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not set in .env file");
  }

  try {
    console.log("📡 Connecting to MongoDB...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      "✅ MongoDB connected! Database:",
      mongoose.connection.name
    );

  } catch (err) {
    console.error(
      "❌ MongoDB connection failed:",
      err.message
    );

    // IMPORTANT: don't kill Node.
    // Let server.js handle the retry.
    throw err;
  }
}

module.exports = { connectDB };