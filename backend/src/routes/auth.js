const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (requires token)
router.get('/me', authMiddleware, me);

module.exports = router;
