const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateUsername } = require('../utils/generateUsername');
const { authRateLimiter, adminVerifyLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const username = await generateUsername();

    const user = new User({
      email,
      password,
      username
    });

    await user.save();

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        rank: user.rank,
        points: user.points,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked. Contact admin.' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account is suspended.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rank: user.rank,
        points: user.points,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Admin password verification
router.post('/admin-verify', adminVerifyLimiter, async (req, res) => {
  const { password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  console.log(`[ADMIN VERIFY] ${new Date().toISOString()} - IP: ${clientIp} - Attempt`);

  if (!password) {
    return res.status(400).json({ error: 'Password required.' });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    const adminToken = jwt.sign(
      { admin: true, purpose: 'admin_login' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    console.log(`[ADMIN VERIFY] ${new Date().toISOString()} - SUCCESS`);
    return res.json({ success: true });
  } else {
    console.log(`[ADMIN VERIFY] ${new Date().toISOString()} - FAILED`);
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('admin_token');
  res.json({ success: true });
});

module.exports = router;