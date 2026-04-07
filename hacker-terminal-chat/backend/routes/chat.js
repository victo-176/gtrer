const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get recent global messages (for initial load if socket fails)
router.get('/recent', protect, async (req, res) => {
  const messages = await Message.find({ type: 'global', deleted: false })
    .sort('-timestamp')
    .limit(50)
    .populate('sender', 'username avatar rank');
  res.json(messages.reverse());
});

module.exports = router;