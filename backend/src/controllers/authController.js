const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedUsername = username.toLowerCase().trim();

    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      return res.status(400).json({ message: 'Username already taken. Please choose another.' });
    }

    // Hash password manually (avoid pre-save hook issues)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name || '',
      username: normalizedUsername,
      passwordHash: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: { id: user._id, username: user.username, name: user.name },
    });

  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username already taken. Please choose another.' });
    }
    return res.status(500).json({ message: 'Server error during registration. Try again.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const normalizedUsername = username.toLowerCase().trim();

    const user = await User.findOne({ username: normalizedUsername }).select('+passwordHash');
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Update lastLogin WITHOUT triggering pre-save hook (use updateOne directly)
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '7d' });

    return res.json({
      token,
      user: { id: user._id, username: user.username, name: user.name },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error during login. Try again.' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('Me error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, me };
