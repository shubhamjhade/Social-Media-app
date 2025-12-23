import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("HOME"); // Options: "HOME", "PROFILE"
  const [user, setUser] = useState(null);   // Stores current user info

  // New Post State
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Fetch Posts & User on Load
  useEffect(() => {
    fetchPosts();
    checkLogin();
  }, []);

  const fetchPosts = () => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => console.error("Error:", err));
  };

  const checkLogin = () => {
    // We try to access a protected route to see who we are
    // (Ideally, you should have a specific /api/me route, but this works for now)
    if (document.cookie.includes("connect.sid")) {
       // We assume user is logged in if cookie exists
       // For this demo, we will just set a flag. 
       // In a real app, fetch("http://localhost:3000/api/me")
    }
  };

  // 2. Handle Create Post (PREVENTS RELOAD)
  const handleCreatePost = async (e) => {
    e.preventDefault(); // <--- CRITICAL: STOPS JUMPING TO PORT 3000
    
    const formData = new FormData();
    formData.append("content", newContent);
    if (newImage) formData.append("image", newImage);

    try {
        const res = await fetch("http://localhost:3000/posting", {
            method: "POST",
            headers: { "Accept": "application/json" }, // Ask for JSON, not HTML
            credentials: "include",
            body: formData,
        });

        const data = await res.json();
        if (data.success) {
            setPosts([data.post, ...posts]); // Add new post to top
            setNewContent("");
            setNewImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            alert("Post Created!");
        }
    } catch (err) { console.error("Failed:", err); }
  };

  // 3. Handle Like
  const handleLike = async (postId) => {
    try {
      const res = await fetch(`http://localhost:3000/like/${postId}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map(post => {
          if (post._id === postId) {
             const newLikes = data.userLiked ? [...post.likes, "me"] : post.likes.slice(0, -1);
             return { ...post, likes: newLikes };
          }
          return post;
        }));
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="app-container">
      {/* NAVIGATION BAR */}
      <nav className="navbar">
        <h1 className="logo" onClick={() => setView("HOME")} style={{cursor:'pointer'}}>SocialApp</h1>
        <div className="nav-links">
            <button className="nav-btn" onClick={() => setView("HOME")}>🏠 Home</button>
            <button className="nav-btn" onClick={() => setView("PROFILE")}>👤 Profile</button>
            <a href="http://localhost:3000/logout" className="logout-btn">Logout</a>
        </div>
      </nav>

      <div className="feed">
        
        {/* VIEW: CREATE POST BOX (Only on Home) */}
        {view === "HOME" && (
            <div className="post-card create-post-box">
                <h3>Create New Post</h3>
                <form onSubmit={handleCreatePost}>
                    <textarea 
                        className="create-input" 
                        placeholder="What's on your mind?"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                    />
                    <div className="file-upload-area">
                        <input type="file" ref={fileInputRef} onChange={(e) => setNewImage(e.target.files[0])} />
                        <button type="submit" className="post-btn">Post</button>
                    </div>
                </form>
            </div>
        )}

        {/* VIEW: PROFILE HEADER */}
        {view === "PROFILE" && (
            <div className="profile-header">
                <h2>👤 My Profile</h2>
                <p>These are the posts visible in the feed.</p>
                <button onClick={() => setView("HOME")} style={{marginTop: '10px'}}>Back to Feed</button>
            </div>
        )}

        {/* POST LIST */}
        {loading && <p>Loading...</p>}
        {posts.map((post) => (
          <div key={post._id} className="post-card">
            <div className="post-header">
                <div className="avatar">👤</div>
                <div className="username">@{post.username}</div>
            </div>
            <p className="post-content">{post.content}</p>
            {post.image && (
              <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Post" />
            )}
            <div className="post-actions">
              <button onClick={() => handleLike(post._id)} className="btn-like">
                ❤️ {post.likes.length} Likes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;