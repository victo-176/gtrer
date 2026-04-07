const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isBlocked || user.isSuspended) {
      return res.status(403).json({ error: 'Account restricted' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Combined admin auth (for admin panel routes)
const adminAuth = async (req, res, next) => {
  try {
    const adminToken = req.cookies.admin_token;
    if (!adminToken) return res.status(401).json({ error: 'Admin authentication required' });

    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (!decoded.admin || decoded.purpose !== 'admin_login') {
      return res.status(401).json({ error: 'Invalid admin session' });
    }

    // Also require a valid user session with admin flag
    const userToken = req.cookies.token;
    if (!userToken) return res.status(401).json({ error: 'User session required' });

    const userDecoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const user = await User.findById(userDecoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Admin authentication failed' });
  }
};

module.exports = { protect, adminOnly, adminAuth };