require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ===== MIDDLEWARES =====
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/ai', require('./routes/aiResume'));
app.use('/api/ai', require('./routes/resumeImport'));
app.use('/api/ats', require('./routes/ats'));
app.use('/api/admin', require('./routes/admin'));
// Root route (friendly message instead of default "Cannot GET /")
app.get('/', (req, res) => {
  res.json({
    message: 'AI Resume Generator API is running 🚀',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      resumes: '/api/resumes',
      ai: '/api/ai',
    },
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;