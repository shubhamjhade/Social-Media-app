import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import "./App.css";

// --- 1. LOGIN COMPONENT ---
function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user); // Save user to state
      navigate("/");      // Go to Home
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="auth-box">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleLogin}>
        <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      <p>Need an account? <Link to="/register">Register</Link></p>
    </div>
  );
}

// --- 2. REGISTER COMPONENT ---
function Register() {
  const [formData, setFormData] = useState({ username: "", password: "", fullName: "", mobile: "" });
  const [msg, setMsg] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    });
    const data = await res.json();
    setMsg(data.error || data.message);
  };

  return (
      <div className="auth-box">
          <h2>Register</h2>
          {msg && <p className="info">{msg}</p>}
          <form onSubmit={handleSubmit}>
              <input placeholder="Username" onChange={(e)=>setFormData({...formData, username:e.target.value})} />
              <input type="password" placeholder="Password" onChange={(e)=>setFormData({...formData, password:e.target.value})} />
              <input placeholder="Full Name" onChange={(e)=>setFormData({...formData, fullName:e.target.value})} />
              <input placeholder="Mobile" onChange={(e)=>setFormData({...formData, mobile:e.target.value})} />
              <button type="submit">Sign Up</button>
          </form>
          <p><Link to="/login">Back to Login</Link></p>
      </div>
  )
}

// --- 3. HOME FEED COMPONENT ---
function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("content", newContent);
    if (newImage) formData.append("image", newImage);

    const res = await fetch("http://localhost:3000/posting", {
        method: "POST",
        credentials: "include",
        body: formData
    });
    const data = await res.json();
    if (data.success) {
        setPosts([data.post, ...posts]);
        setNewContent("");
        setNewImage(null);
        fileInputRef.current.value = "";
    }
  };

  const handleLike = async (postId) => {
      const res = await fetch(`http://localhost:3000/like/${postId}`, { credentials: "include" });
      const data = await res.json();
      if(data.success) {
          setPosts(posts.map(p => p._id === postId ? { ...p, likes: data.likes } : p));
      }
  };

  const handleDelete = async (postId) => {
      if(!confirm("Delete?")) return;
      const res = await fetch(`http://localhost:3000/delete/${postId}`, { method: "DELETE", credentials: "include" });
      if(res.ok) setPosts(posts.filter(p => p._id !== postId));
  };

  return (
    <div className="feed">
      {/* Create Post */}
      <div className="post-card create-box">
          <form onSubmit={handleCreatePost}>
              <textarea placeholder="What's on your mind?" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              <input type="file" ref={fileInputRef} onChange={(e) => setNewImage(e.target.files[0])} />
              <button type="submit">Post</button>
          </form>
      </div>

      {/* Feed List */}
      {posts.map(post => (
          <div key={post._id} className="post-card">
              <div className="post-header">
                  <strong>@{post.username}</strong>
                  {(user.isAdmin || user.username === post.username) && 
                      <button onClick={() => handleDelete(post._id)} className="delete-btn">🗑️</button>
                  }
              </div>
              <p>{post.content}</p>
              {post.image && <img src={`http://localhost:3000/uploads/${post.image}`} className="post-img" />}
              <div className="actions">
                  <button onClick={() => handleLike(post._id)}>
                      ❤️ {post.likes.length} Likes
                  </button>
              </div>
          </div>
      ))}
    </div>
  );
}

// --- 4. ADMIN COMPONENT ---
function Admin() {
    const [data, setData] = useState({ pending: [], active: [] });

    useEffect(() => {
        fetch("http://localhost:3000/api/admin/users", { credentials: "include" })
            .then(res => res.json())
            .then(setData)
            .catch(err => console.log("Not Admin"));
    }, []);

    const approveUser = async (id) => {
        await fetch(`http://localhost:3000/api/admin/approve/${id}`, { method: "POST", credentials: "include" });
        // Refresh list
        setData({ ...data, pending: data.pending.filter(u => u._id !== id) });
    };

    return (
        <div className="feed">
            <h2>👑 Admin Panel</h2>
            <h3>Pending Approvals</h3>
            {data.pending.length === 0 && <p>No pending users.</p>}
            {data.pending.map(u => (
                <div key={u._id} className="post-card">
                    <span>{u.username} ({u.fullName})</span>
                    <button onClick={() => approveUser(u._id)}>✅ Approve</button>
                </div>
            ))}
            
            <h3>Active Users</h3>
            {data.active.map(u => <div key={u._id} className="post-card">{u.username}</div>)}
        </div>
    );
}

// --- 5. MAIN APP (ROUTER) ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login on load
  useEffect(() => {
    fetch("http://localhost:3000/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
      await fetch("http://localhost:3000/logout", { method: "POST", credentials: "include" });
      setUser(null);
      window.location.href = "/login"; // Force refresh to clear state
  };

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <div className="app-container">
        {user && (
            <nav className="navbar">
                <span className="logo">SocialApp</span>
                <div>
                    <Link to="/">🏠 Home</Link>
                    {user.isAdmin && <Link to="/admin">👑 Admin</Link>}
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </nav>
        )}

        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/admin" element={user && user.isAdmin ? <Admin /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;