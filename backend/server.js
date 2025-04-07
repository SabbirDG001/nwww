const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const apiRoutes = require('./routes/api');
const router = express.Router();
const Class = require('./models/Class');
const Session = require('./models/session');

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

mongoose.connect('mongodb://localhost:27017/attendance', {
}).then(() => {
  console.log('MongoDB connected');
  app.listen(3000, () => console.log('Server running on http://localhost:3000'));
}).catch(console.error);



router.post('/classes', async (req, res) => {
  const { name, session } = req.body;

  try {
    const sessionTemplate = await Session.findOne({ name: session });
    if (!sessionTemplate) return res.status(404).json({ error: 'Session not found' });

    const newClass = new Class({
      name,
      session,
      data: sessionTemplate.data  // assume session has a data field to copy
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
