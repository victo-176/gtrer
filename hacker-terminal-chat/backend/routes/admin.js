const express = require('express');
const User = require('../models/User');
const Message = require('../models/Message');
const Task = require('../models/Task');
const Report = require('../models/Report');
const { adminAuth } = require('../middleware/auth');
const { generateUsername } = require('../utils/generateUsername');
const { calculateRank } = require('../utils/rankSystem');
const router = express.Router();

// All routes require adminAuth
router.use(adminAuth);

// Get all users
router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.json(users);
});

// Update user (points, rank, status)
router.patch('/users/:id', async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['rank', 'points', 'isSuspended', 'isBlocked'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (updates.points !== undefined) {
      user.points = Math.max(0, user.points + updates.points);
      user.rank = calculateRank(user.points);
    }
    if (updates.rank) user.rank = updates.rank;
    if (updates.isSuspended !== undefined) user.isSuspended = updates.isSuspended;
    if (updates.isBlocked !== undefined) user.isBlocked = updates.isBlocked;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete user message
router.delete('/messages/:id', async (req, res) => {
  await Message.findByIdAndUpdate(req.params.id, { deleted: true });
  res.json({ success: true });
});

// Get all messages
router.get('/messages', async (req, res) => {
  const messages = await Message.find({ deleted: false })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username')
    .sort('-timestamp')
    .limit(500);
  res.json(messages);
});

// Get reports
router.get('/reports', async (req, res) => {
  const reports = await Report.find()
    .populate('reporter', 'username')
    .populate('reportedUser', 'username')
    .sort('-createdAt');
  res.json(reports);
});

// Resolve report
router.patch('/reports/:id', async (req, res) => {
  const { status } = req.body;
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    {
      status,
      resolvedAt: new Date(),
      resolvedBy: req.user._id
    },
    { new: true }
  );
  res.json(report);
});

// Get all tasks (admin view)
router.get('/tasks', async (req, res) => {
  const tasks = await Task.find()
    .populate('assignedTo', 'username')
    .populate('assignedBy', 'username')
    .sort('-createdAt');
  res.json(tasks);
});

// Create task
router.post('/tasks', async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      assignedBy: req.user._id
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Reset username
router.post('/users/:id/reset-username', async (req, res) => {
  try {
    const newUsername = await generateUsername();
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username: newUsername },
      { new: true }
    );
    res.json({ username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset username' });
  }
});

module.exports = router;