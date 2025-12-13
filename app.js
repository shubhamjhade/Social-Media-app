const express = require('express');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer'); // Import Multer
const path = require('path');
const User = require('./models/user');
const Post = require('./models/post');

const app = express();

// --- DB CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/socialMediaDB')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// --- MULTER SETUP (For Image Uploads) ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    // Save file as: fieldname-timestamp.jpg
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10000000 }, // Limit 5MB
}).single('image'); // Field name in form must be 'image'

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // This lets us serve the images
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));

// --- SEED OWNER ---
async function seedOwner() {
  await User.findOneAndUpdate(
    { username: "shubham" },
    { 
      username: "shubham",
      password: "123",
      fullName: "Owner Shubham",
      isAdmin: true,
      isApproved: true
    },
    { upsert: true, new: true }
  );
  console.log("Owner Account (shubham) is Verified and Ready.");
}
seedOwner();

// --- AUTH MIDDLEWARE ---
const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.isAdmin) return res.redirect('/');
  next();
};

// --- ROUTES ---

// Login & Register (Same as before)
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.render('login', { error: "Invalid Username or Password." });
  if (user.isApproved === false) return res.render('login', { error: "Account Pending! Wait for approval." });

  req.session.userId = user._id;
  req.session.username = user.username;
  req.session.isAdmin = user.isAdmin;
  res.redirect('/');
});

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { username, password, fullName, collegeId, mobile } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.send("Username taken.");
  await User.create({ username, password, fullName, collegeId, mobile, isApproved: false, isAdmin: false });
  res.render('login', { error: "Registration Successful! Please wait for Owner approval." });
});

// Logout
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// --- CORE SOCIAL FEATURES ---

// 1. HOME (Updated to pass user ID for likes/delete logic)
app.get('/', requireLogin, async (req, res) => {
  const posts = await Post.find().sort({ date: -1 });
  res.render('home', { 
    posts, 
    currentUser: req.session.username,
    currentUserId: req.session.userId, // Needed to check if I liked a post
    isAdmin: req.session.isAdmin 
  });
});

// 2. POSTING (Updated with Multer Middleware)
app.get('/posting', requireLogin, (req, res) => res.render('posting'));

app.post('/posting', requireLogin, (req, res) => {
  upload(req, res, async (err) => {
    if(err){ return res.send("Error uploading file."); }
    
    await Post.create({
      content: req.body.content,
      image: req.file ? req.file.filename : null, // Save filename if exists
      user: req.session.userId,
      username: req.session.username
    });
    res.redirect('/');
  });
});

// 3. DELETE POST (Owner can delete ALL, User can delete OWN)
app.get('/delete/:id', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  // Security Check: Only allow if Owner OR Author
  if(req.session.isAdmin || post.user.toString() === req.session.userId){
    await Post.findByIdAndDelete(req.params.id);
  }
  
  // Redirect back to where they came from
  res.redirect('/'); 
});

// 4. LIKE POST
app.get('/like/:id', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  // Check if user already liked it
  if (post.likes.includes(req.session.userId)) {
    // Unlike (Remove ID from array)
    post.likes.pull(req.session.userId);
  } else {
    // Like (Add ID to array)
    post.likes.push(req.session.userId);
  }
  
  await post.save();
  res.redirect('/'); // Reload page to show new count
});

// 5. PROFILE
app.get('/profile', requireLogin, async (req, res) => {
  const userPosts = await Post.find({ user: req.session.userId }).sort({ date: -1 });
  res.render('profile', { 
    posts: userPosts, 
    currentUser: req.session.username,
    currentUserId: req.session.userId,
    isAdmin: req.session.isAdmin
  });
});

// 6. ADMIN
app.get('/admin', requireLogin, requireAdmin, async (req, res) => {
  const pendingUsers = await User.find({ isApproved: false });
  const activeUsers = await User.find({ isApproved: true, isAdmin: false });
  res.render('admin', { pendingUsers, activeUsers });
});
app.post('/admin/approve/:id', requireLogin, requireAdmin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isApproved: true });
  res.redirect('/admin');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));