const rateLimit = require('express-rate-limit');

// General auth rate limiter (login/register/admin-verify)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many authentication attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for admin verification
const adminVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: { error: 'Too many admin verification attempts. Access blocked temporarily.' },
});

module.exports = { authRateLimiter, adminVerifyLimiter };