const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const adminToken = req.cookies.admin_token;
    if (!adminToken) {
      return res.status(401).json({ error: 'Admin authentication required.' });
    }

    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (!decoded.admin || decoded.purpose !== 'admin_login') {
      return res.status(401).json({ error: 'Invalid admin session.' });
    }

    const userToken = req.cookies.token;
    if (!userToken) {
      return res.status(401).json({ error: 'User session required.' });
    }

    const userDecoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const user = await User.findById(userDecoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Admin authentication failed.' });
  }
};

module.exports = { adminAuth };