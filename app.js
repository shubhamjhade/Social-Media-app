const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const User = require('./models/user');
const Post = require('./models/post');

const app = express();

// --- 1. CONFIGURATION ---
// Allow React (Port 5173) to send cookies and requests
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json()); // Handle JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve uploaded images

// Session Setup (The "Cookie")
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    httpOnly: true, 
    maxAge: 1000 * 60 * 60 * 24 // 1 Day
  }
}));

// Connect to DB
mongoose.connect('mongodb://127.0.0.1:27017/socialMediaDB')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error(err));

// Multer (Image Uploads)
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, 'post-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single('image');

// --- 2. AUTH ROUTES ---

// Check if I am already logged in (React calls this on load)
app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ loggedIn: false });
  res.json({ 
    loggedIn: true, 
    username: req.session.username, 
    isAdmin: req.session.isAdmin,
    userId: req.session.userId 
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  if (!user.isApproved) return res.status(403).json({ error: "Account pending approval" });

  // Set Session
  req.session.userId = user._id;
  req.session.username = user.username;
  req.session.isAdmin = user.isAdmin;

  res.json({ success: true, user });
});

app.post('/register', async (req, res) => {
  const { username, password, fullName, mobile } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: "Username taken" });

  await User.create({ username, password, fullName, mobile, isApproved: false, isAdmin: false });
  res.json({ success: true, message: "Registered! Wait for admin approval." });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// --- 3. POST ROUTES ---

// Get All Posts
app.get('/api/posts', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  const posts = await Post.find().sort({ date: -1 });
  res.json(posts);
});

// Create Post
app.post('/posting', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: "Upload failed" });

    const newPost = await Post.create({
      content: req.body.content,
      image: req.file ? req.file.filename : null,
      user: req.session.userId,
      username: req.session.username,
      likes: [],
      comments: []
    });
    res.json({ success: true, post: newPost });
  });
});

// Like Post
app.get('/like/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  const post = await Post.findById(req.params.id);
  
  if (post.likes.includes(req.session.userId)) {
    post.likes.pull(req.session.userId);
  } else {
    post.likes.push(req.session.userId);
  }
  await post.save();
  res.json({ success: true, likes: post.likes, userLiked: post.likes.includes(req.session.userId) });
});

// Comment
app.post('/comment/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  const post = await Post.findById(req.params.id);
  
  const comment = {
    user: req.session.userId,
    username: req.session.username,
    text: req.body.text,
    _id: new mongoose.Types.ObjectId()
  };
  post.comments.push(comment);
  await post.save();
  res.json({ success: true, comment });
});

// Delete Post
app.delete('/delete/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
    const post = await Post.findById(req.params.id);
    
    if (req.session.isAdmin || post.user.toString() === req.session.userId) {
        await Post.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
    }
    res.status(403).json({ error: "Not allowed" });
});

// --- 4. ADMIN ROUTES ---
app.get('/api/admin/users', async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: "Admins only" });
  
  const pending = await User.find({ isApproved: false });
  const active = await User.find({ isApproved: true, isAdmin: false });
  res.json({ pending, active });
});

app.post('/api/admin/approve/:id', async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: "Admins only" });
  await User.findByIdAndUpdate(req.params.id, { isApproved: true });
  res.json({ success: true });
});



app.listen(3000, () => console.log('🚀 Server running on Port 3000 (API Only)'));