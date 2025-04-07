const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const Class = require('../models/Class');

// Get all sessions (for dropdown)
router.get('/sessions', async (req, res) => {
  const sessions = await Session.find();
  res.json(sessions);
});

// Get all classes (for dashboard)
router.get('/classes', async (req, res) => {
  const classes = await Class.find();
  res.json(classes);
});

// Add new class by copying session template
router.post('/classes', async (req, res) => {
  const { name, session, data } = req.body;

  try {
    const newClass = new Class({
      name,
      session,
      data // student/session structure copied from session
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete a class
router.delete('/classes/:id', async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Get full session by name (for copying)
router.get('/sessions/:name', async (req, res) => {
  try {
    const session = await Session.findOne({ name: req.params.name });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
