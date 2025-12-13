const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/user');
const Post = require('./models/post');

const app = express();

// --- DB CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/socialMediaDB')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));

// --- SEED OWNER (Run once) ---
// --- SEED OWNER (Runs every time to ensure Owner is always approved) ---
async function seedOwner() {
  await User.findOneAndUpdate(
    { username: "shubham" }, // Find the user 'shubham'
    { 
      username: "shubham",
      password: "123",
      fullName: "Owner Shubham",
      isAdmin: true,     // Force Admin status
      isApproved: true   // Force Approved status
    },
    { upsert: true, new: true } // Create if doesn't exist, Update if it does
  );
  console.log("Owner Account (shubham) is Verified and Ready.");
}
seedOwner();

// --- MIDDLEWARE TO PROTECT ROUTES ---
const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.isAdmin) return res.redirect('/');
  next();
};

// --- ROUTES ---

// 1. LOGIN
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (!user) {
    return res.render('login', { error: "Invalid Username or Password." });
  }

  // CHECK APPROVAL STATUS
  if (user.isApproved === false) {
    return res.render('login', { error: "Account Pending! The Owner has not approved your request yet." });
  }

  // Login Success
  req.session.userId = user._id;
  req.session.username = user.username;
  req.session.isAdmin = user.isAdmin;
  res.redirect('/');
});

// 2. REGISTER (Sign Up)
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password, fullName, collegeId, mobile } = req.body;
  
  const existing = await User.findOne({ username });
  if (existing) return res.send("Username taken.");

  await User.create({
    username, password, fullName, collegeId, mobile,
    isApproved: false, // Default to pending
    isAdmin: false
  });

  res.render('login', { error: "Registration Successful! Please wait for Owner approval." });
});

// 3. HOME (Visible to all approved users)
app.get('/', requireLogin, async (req, res) => {
  const posts = await Post.find().sort({ date: -1 });
  res.render('home', { 
    posts, 
    currentUser: req.session.username,
    isAdmin: req.session.isAdmin 
  });
});

// 4. ADMIN DASHBOARD (Owner Only)
app.get('/admin', requireLogin, requireAdmin, async (req, res) => {
  // Get all users who are NOT approved yet
  const pendingUsers = await User.find({ isApproved: false });
  // Get all approved users (excluding the owner)
  const activeUsers = await User.find({ isApproved: true, isAdmin: false });
  
  res.render('admin', { pendingUsers, activeUsers });
});

// 5. APPROVE USER
app.post('/admin/approve/:id', requireLogin, requireAdmin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isApproved: true });
  res.redirect('/admin');
});

// Other Standard Routes (Posting, Profile, Logout)
app.get('/posting', requireLogin, (req, res) => res.render('posting'));
app.post('/posting', requireLogin, async (req, res) => {
  await Post.create({ content: req.body.content, user: req.session.userId, username: req.session.username });
  res.redirect('/');
});
app.get('/profile', requireLogin, async (req, res) => {
  const userPosts = await Post.find({ user: req.session.userId }).sort({ date: -1 });
  res.render('profile', { posts: userPosts, currentUser: req.session.username });
});
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));