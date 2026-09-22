/* ============================================================
   SERVER ENTRY POINT
   ============================================================ */

require("dotenv").config();

const app = require("./src/app");
const { connectDB } = require("./src/config/db");

const PORT = Number(process.env.PORT || 4000);

/* ============================================================
   START HTTP SERVER FIRST
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

async function connectDatabase() {
  try {
    console.log("📡 Connecting to MongoDB...");

    await connectDB();

    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("");
    console.error("⚠️ MongoDB connection failed.");

    console.error(
      "MongoDB error:",
      error?.message || error
    );

    console.error("");

    console.error(
      "ℹ️ The API server will remain running."
    );

    console.error(
      "ℹ️ Live job recommendations do not require MongoDB."
    );

    console.error(
      "ℹ️ MongoDB will be retried automatically."
    );

    console.error("");
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
  console.error(
    "❌ HTTP server error:",
    error
  );

  if (error.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already being used.`
    );

    console.error(
      "ℹ️ Stop the other backend process or use a different PORT."
    );
  }
});

/* ============================================================
   GRACEFUL SHUTDOWN
   ============================================================ */

const shutdown = (signal) => {
  console.log("");
  console.log(
    `🛑 ${signal} received. Shutting down...`
  );

  server.close(() => {
    console.log(
      "✅ HTTP server closed."
    );

    process.exit(0);
  });
};

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);