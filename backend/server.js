/* ============================================================
   SERVER ENTRY POINT
   ============================================================ */
const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);


require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./src/app");
const { connectDB } = require("./src/config/db");
const questionBankService = require("./src/services/questionBankService");

const PORT = Number(process.env.PORT || 4000);

/* ============================================================
   START HTTP SERVER
   ============================================================ */

const server = app.listen(PORT, () => {
  console.log("");
  console.log("==================================================");
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`💼 Jobs:   http://localhost:${PORT}/api/ai/jobs`);
  console.log("==================================================");
  console.log("");
});

/* ============================================================
   DATABASE CONNECTION
   ============================================================ */

let isConnecting = false;

async function connectDatabase() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection already being attempted
  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    await connectDB();

    console.log("✅ MongoDB connected successfully.");
    questionBankService.ensureSeedData().catch((e) => {
      console.warn("Auto-seed warning:", e.message);
    });

  } catch (error) {
    console.error("");
    console.error("⚠️ MongoDB connection failed.");
    console.error(
      "MongoDB error:",
      error?.message || error
    );
    console.error("");
    console.error(
      "ℹ️ API server will remain running."
    );
    console.error(
      "ℹ️ MongoDB will be retried automatically."
    );
    console.error("");

  } finally {
    isConnecting = false;
  }
}

/* ============================================================
   INITIAL DATABASE CONNECTION
   ============================================================ */

connectDatabase();

/* ============================================================
   DATABASE RETRY
   ============================================================ */

const DB_RETRY_INTERVAL = 15000;

setInterval(() => {
  connectDatabase();
}, DB_RETRY_INTERVAL);

/* ============================================================
   SERVER ERROR HANDLING
   ============================================================ */

server.on("error", (error) => {
  console.error("❌ HTTP server error:", error);

  if (error.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already being used.`
    );
  }
});

/* ============================================================
   GRACEFUL SHUTDOWN
   ============================================================ */

const shutdown = (signal) => {
  console.log("");
  console.log(`🛑 ${signal} received. Shutting down...`);

  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));