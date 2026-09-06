require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-fallback-secret',
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};
