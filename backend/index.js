const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();

// --- 1. CONFIGURATION ---
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

mongoose.connect('mongodb://127.0.0.1:27017/socialMediaDB')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error(err));

// --- MULTER ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => cb(null, 'file-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    fullName: String,
    mobile: String,
    isAdmin: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema({
    content: String,
    image: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    likes: [String],
    comments: [{ user: String, username: String, text: String, _id: String }],
    date: { type: Date, default: Date.now }
});
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

// --- SIMPLIFIED THREAD SCHEMA (Open to All) ---
const threadSchema = new mongoose.Schema({
    title: String,
    username: String,
    userId: String,
    createdAt: { type: Date, default: Date.now }
});
const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);

const threadPostSchema = new mongoose.Schema({
    threadId: String,
    content: String,
    image: String,
    username: String,
    userId: String,
    likes: [String], // <--- NEW: Stores who liked the post
    createdAt: { type: Date, default: Date.now }
});
const ThreadPost = mongoose.models.ThreadPost || mongoose.model("ThreadPost", threadPostSchema);


// --- ROUTES ---

// Auth
app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ loggedIn: false });
  res.json({ loggedIn: true, username: req.session.username, isAdmin: req.session.isAdmin, userId: req.session.userId });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  if (!user.isApproved) return res.status(403).json({ error: "Account pending approval" });
  req.session.userId = user._id; req.session.username = user.username; req.session.isAdmin = user.isAdmin;
  res.json({ success: true, user });
});

app.post('/register', async (req, res) => {
  const { username, password, fullName, mobile } = req.body;
  if (await User.findOne({ username })) return res.status(400).json({ error: "Username taken" });
  await User.create({ username, password, fullName, mobile });
  res.json({ success: true });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ success: true }); });
});

// Posts
app.get('/api/posts', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  res.json(await Post.find().sort({ date: -1 }));
});

app.post('/posting', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: "Upload failed" });
    const newPost = await Post.create({
      content: req.body.content,
      image: req.file ? req.file.filename : null,
      user: req.session.userId,
      username: req.session.username,
      likes: [], comments: []
    });
    res.json({ success: true, post: newPost });
  });
});

app.get('/like/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  const post = await Post.findById(req.params.id);
  if (post.likes.includes(req.session.userId)) post.likes.pull(req.session.userId);
  else post.likes.push(req.session.userId);
  await post.save();
  res.json({ success: true, likes: post.likes });
});

app.post('/comment/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  const post = await Post.findById(req.params.id);
  post.comments.push({ user: req.session.userId, username: req.session.username, text: req.body.text, _id: new mongoose.Types.ObjectId() });
  await post.save();
  res.json({ success: true, comment: post.comments[post.comments.length - 1] });
});

app.delete('/delete/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
    const post = await Post.findById(req.params.id);
    if (req.session.isAdmin || post.user.toString() === req.session.userId) {
        await Post.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
    }
    res.status(403).json({ error: "Not allowed" });
});

// Admin
app.get('/api/admin/users', async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: "Admins only" });
  res.json({ pending: await User.find({ isApproved: false }), active: await User.find({ isApproved: true, isAdmin: false }) });
});

app.post('/api/admin/approve/:id', async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: "Admins only" });
  await User.findByIdAndUpdate(req.params.id, { isApproved: true });
  res.json({ success: true });
});

app.delete('/api/admin/user/:id', async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: "Admins only" });
  await User.findByIdAndDelete(req.params.id);
  await Post.deleteMany({ user: req.params.id });
  res.json({ success: true });
});

// User Update
app.put('/api/user/update', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  const { username, mobile } = req.body;
  const updatedUser = await User.findByIdAndUpdate(req.session.userId, { username, mobile }, { new: true });
  req.session.username = updatedUser.username;
  res.json({ success: true, user: updatedUser });
});

// --- THREADS (OPEN TO ALL) ---

// Create
app.post("/api/threads", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ success: false });
    const newThread = new Thread({ title: req.body.title, username: req.session.username, userId: req.session.userId });
    await newThread.save();
    res.json({ success: true, thread: newThread });
});

// Get All
app.get("/api/threads", async (req, res) => {
    res.json(await Thread.find().sort({ createdAt: -1 }));
});

// Post in Thread
app.post("/api/threads/:id/posts", upload.single("image"), async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ success: false });
    const newPost = new ThreadPost({
        threadId: req.params.id,
        content: req.body.content,
        image: req.file ? req.file.filename : null,
        username: req.session.username,
        userId: req.session.userId
    });
    await newPost.save();
    res.json({ success: true, post: newPost });
});

// Get Thread Posts
app.get("/api/threads/:id/posts", async (req, res) => {
    res.json(await ThreadPost.find({ threadId: req.params.id }).sort({ createdAt: -1 }));
});

// Reset DB
app.get('/api/nuke', async (req, res) => {
    await User.deleteMany({}); await Post.deleteMany({}); await Thread.deleteMany({}); await ThreadPost.deleteMany({});
    req.session.destroy();
    res.send("💥 Database Wiped Successfully!");
});

// Toggle Like on a Thread Post
app.get('/api/threads/posts/:id/like', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
    
    try {
        const post = await ThreadPost.findById(req.params.id);
        
        // Defensive check: ensure likes array exists
        if (!post.likes) post.likes = [];

        if (post.likes.includes(req.session.userId)) {
            post.likes.pull(req.session.userId); // Unlike
        } else {
            post.likes.push(req.session.userId); // Like
        }
        
        await post.save();
        res.json({ success: true, likes: post.likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('🚀 Server running on Port 3000'));