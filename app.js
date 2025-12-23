const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer'); // Import Multer
const path = require('path');
const cors = require('cors'); // Import CORS
const User = require('./models/user');
const Post = require('./models/post');

const app = express();

// --- CORS CONFIGURATION (Connect React) ---
app.use(cors({
  origin: 'http://localhost:5173', // This is where React runs
  credentials: true // Allow cookies/sessions between React and Node
}));

// --- DB CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/socialMediaDB')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// --- MULTER SETUP (For Image Uploads) ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10000000 }, // Limit 10MB
}).single('image');

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // IMPORTANT: Added to handle JSON data from React
app.use(express.static('public')); 

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
  if (!req.session.userId) {
     // If request is from React/API, send JSON error instead of redirecting
     if(req.headers.accept && req.headers.accept.includes('application/json')) {
         return res.status(401).json({ error: "Not logged in" });
     }
     return res.redirect('/login');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.isAdmin) return res.redirect('/');
  next();
};

// --- ROUTES ---

// --- NEW API ROUTE FOR REACT ---
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username') // optional: get author details if ref exists
      .sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login & Register
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.render('login', { error: "Invalid Username or Password." });
  if (user.isApproved === false) return res.render('login', { error: "Account Pending! Wait for approval." });

  req.session.userId = user._id;
  req.session.username = user.username;
  req.session.isAdmin = user.isAdmin;
  
  // If request is JSON (from React), send JSON response
  if(req.xhr || req.headers.accept.indexOf('json') > -1){
      return res.json({ success: true, user });
  }
  
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

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// --- CORE SOCIAL FEATURES ---

// 1. HOME (Legacy EJS View)
app.get('/', requireLogin, async (req, res) => {
  const posts = await Post.find().sort({ date: -1 });
  res.render('home', { 
    posts, 
    currentUser: req.session.username,
    currentUserId: req.session.userId, 
    isAdmin: req.session.isAdmin 
  });
});

// 2. POSTING
// 2. POSTING (Updated for React + JSON)
app.get('/posting', requireLogin, (req, res) => res.render('posting'));

app.post('/posting', requireLogin, (req, res) => {
  upload(req, res, async (err) => {
    if(err){ return res.status(500).json({ error: "Error uploading file." }); }
    
    try {
        const newPost = await Post.create({
          content: req.body.content,
          image: req.file ? req.file.filename : null,
          user: req.session.userId,
          username: req.session.username
        });

        // IF request asks for JSON (React), send the new post back
        if(req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ success: true, post: newPost });
        }

        // IF standard HTML form, redirect as usual
        res.redirect('/');
        
    } catch (dbErr) {
        res.status(500).json({ error: dbErr.message });
    }
  });
});

// 3. DELETE POST
app.get('/delete/:id', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if(req.session.isAdmin || post.user.toString() === req.session.userId){
    await Post.findByIdAndDelete(req.params.id);
  }
  res.redirect('/'); 
});

// 4. LIKE POST (AJAX/JSON)
app.get('/like/:id', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (post.likes.includes(req.session.userId)) {
      post.likes.pull(req.session.userId);
    } else {
      post.likes.push(req.session.userId);
    }
    
    await post.save();
    res.json({ 
      success: true, 
      likesCount: post.likes.length, 
      userLiked: post.likes.includes(req.session.userId) 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. ADD COMMENT (AJAX/JSON)
app.post('/comment/:id', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    const newComment = {
      user: req.session.userId,
      username: req.session.username,
      text: req.body.text,
      _id: new mongoose.Types.ObjectId()
    };

    post.comments.push(newComment);
    await post.save();
    
    res.json({ success: true, comment: newComment });
    
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DELETE COMMENT
app.get('/comment/:postId/:commentId/delete', requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const comment = post.comments.id(req.params.commentId);
    
    if (comment && (req.session.isAdmin || comment.user.toString() === req.session.userId)) {
        post.comments.pull(req.params.commentId);
        await post.save();
    }
    res.redirect('/'); 
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

// 7. PROFILE
app.get('/profile', requireLogin, async (req, res) => {
  const userPosts = await Post.find({ user: req.session.userId }).sort({ date: -1 });
  res.render('profile', { 
    posts: userPosts, 
    currentUser: req.session.username,
    currentUserId: req.session.userId,
    isAdmin: req.session.isAdmin
  });
});

// 8. ADMIN
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