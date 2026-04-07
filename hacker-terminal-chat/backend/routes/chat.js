const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get recent global messages
router.get('/recent', protect, async (req, res) => {
  try {
    const messages = await Message.find({ type: 'global', deleted: false })
      .sort('-timestamp')
      .limit(50)
      .populate('sender', 'username avatar rank');
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;