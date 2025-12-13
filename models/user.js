const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Login Details
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Personal Details
  fullName: { type: String },
  collegeId: { type: String },
  mobile: { type: String },

  // System Flags
  isAdmin: { type: Boolean, default: false }, // True for 'shubham'
  isApproved: { type: Boolean, default: false } // True for owner, False for new users
});

module.exports = mongoose.model('User', userSchema);