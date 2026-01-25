const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  image: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  date: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // NEW: Store comments directly inside the post
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      text: String,
      date: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Post', postSchema);