const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get tasks for current user
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id }).sort('-createdAt');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

module.exports = router;