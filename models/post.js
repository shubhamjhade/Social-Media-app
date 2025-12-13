const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  image: { type: String }, // Stores the filename of the uploaded image
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  date: { type: Date, default: Date.now },
  
  // Array of user IDs who liked the post
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Post', postSchema);