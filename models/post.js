const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Links post to a user
  username: { type: String }, // Storing name for easier display
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);