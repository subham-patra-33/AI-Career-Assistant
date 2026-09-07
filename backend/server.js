require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();
