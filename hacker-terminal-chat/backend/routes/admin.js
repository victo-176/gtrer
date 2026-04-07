// Add to existing admin routes:

// Get all tasks (admin view)
router.get('/tasks', async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'username').populate('assignedBy', 'username');
  res.json(tasks);
});

// Create task (already there but ensure it's included)
router.post('/tasks', async (req, res) => {
  const task = await Task.create({
    ...req.body,
    assignedBy: req.user._id
  });
  res.status(201).json(task);
});