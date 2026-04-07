const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { calculateRank } = require('../utils/rankSystem');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/avatars',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

// Get current user
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// Update avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
    res.json({ avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get user's tasks
router.get('/tasks', protect, async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id }).sort('-createdAt');
  res.json(tasks);
});

// Complete a task
router.patch('/tasks/:taskId/complete', protect, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, assignedTo: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.completed) return res.status(400).json({ error: 'Task already completed' });

    task.completed = true;
    task.completedAt = new Date();
    await task.save();

    const user = await User.findById(req.user._id);
    user.points += task.points;
    user.rank = calculateRank(user.points);
    await user.save();

    res.json({
      success: true,
      task,
      user: { points: user.points, rank: user.rank }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

module.exports = router;