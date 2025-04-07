const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  session: { type: String, required: true },
  data: [{ date: String, topic: String }]
});

module.exports = mongoose.model('Class', classSchema);
