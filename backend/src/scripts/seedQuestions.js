const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const InterviewQuestion = require("../models/InterviewQuestion");
const { SEED_QUESTIONS } = require("../data/seedQuestions");

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is missing in environment variables.");
    process.exit(1);
  }

  try {
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ MongoDB connected.");

    console.log(`🧹 Clearing existing questions or updating...`);
    // Upsert each question by question string to avoid duplication
    let inserted = 0;
    let updated = 0;

    for (const q of SEED_QUESTIONS) {
      const res = await InterviewQuestion.updateOne(
        { question: q.question },
        { $set: q },
        { upsert: true }
      );
      if (res.upsertedCount > 0) inserted++;
      else updated++;
    }

    const total = await InterviewQuestion.countDocuments();
    console.log(`✅ Seed complete: ${inserted} inserted, ${updated} updated. Total questions in bank: ${total}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
