const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  data: [{ date: String, topic: String }] // Or whatever structure your session holds
});

module.exports = mongoose.model('Session', sessionSchema);
