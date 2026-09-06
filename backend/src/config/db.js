const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('⚠️  MONGO_URI not set in .env file!');
    return;
  }

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      // Try direct connection if SRV fails
      directConnection: false,
    });
    console.log('✅ MongoDB connected! Database:', mongoose.connection.name);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚠️  Server starting WITHOUT database. Register/Login will not work.');
    console.warn('⚠️  Fix: Check your MONGO_URI in .env file');
    // Don't exit - let server run so frontend still loads
  }
}

module.exports = { connectDB };