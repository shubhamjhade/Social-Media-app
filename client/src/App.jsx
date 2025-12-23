import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentTexts, setCommentTexts] = useState({});
  const [currentView, setCurrentView] = useState("HOME"); // "HOME" or "PROFILE"
  const [currentUser, setCurrentUser] = useState(null); // To store who is logged in

  // New State for Creating Posts
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Fetch Posts & User Info on Load
  useEffect(() => {
    fetchPosts();
    fetchUser();
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

  // Check who is logged in so we can filter profile posts
  const fetchUser = () => {
      // We will assume the backend '/login' endpoint returns user data if we call it, 
      // but typically you'd have a specific '/api/me' endpoint. 
      // For now, we'll use the user data attached to posts to guess, 
      // OR better: we can store the username in localStorage when logging in.
      // A quick hack for this project: Fetch posts and see which ones have "delete" enabled? 
      // No, let's just create a quick check.
      
      // Since we don't have a specific user endpoint yet, we will rely on 
      // the backend session cookie. We will filter posts by "username" on the frontend 
      // if we click Profile.
      // (For a real job, you would create a /api/user endpoint).
  };

  // 2. Handle Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent && !newImage) return;

    const formData = new FormData();
    formData.append("content", newContent);
    if (newImage) formData.append("image", newImage);

    try {
        const res = await fetch("http://localhost:3000/posting", {
            method: "POST",
            headers: { "Accept": "application/json" },
            credentials: "include",
            body: formData,
        });

        const data = await res.json();
        if (data.success) {
            setPosts([data.post, ...posts]);
            setNewContent("");
            setNewImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setCurrentView("HOME"); // Go back to home after posting
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
            const newLikes = data.userLiked 
                ? [...post.likes, "me"] 
                : post.likes.slice(0, -1);
            return { ...post, likes: newLikes };
          }
          return post;
        }));
      }
    } catch (err) { console.error(err); }
  };

  // 4. Handle Delete Post (New Feature for React)
  const handleDelete = async (postId) => {
      if(!window.confirm("Delete this post?")) return;
      
      try {
          await fetch(`http://localhost:3000/delete/${postId}`, { credentials: "include" });
          // Remove from list UI
          setPosts(posts.filter(p => p._id !== postId));
      } catch (err) { console.error(err); }
  };

  // Filter posts for Profile View
  // Note: Since we don't have the logged-in username in React state easily without a new API,
  // we will filter by "My Posts" (requires backend support) OR
  // simply show ALL posts for now but styled differently.
  // **Better solution for your deadline:** // We will assume the user wants to see posts where they are the author.
  // We need to know who "I" am. 
  // Let's add a tiny fetch to get our own username.
  
  // Actually, let's just use the "Create Post" box as the indicator for Home.
  
  return (
    <div className="app-container">
      <nav className="navbar">
        <h1 className="logo" onClick={() => setCurrentView("HOME")} style={{cursor: 'pointer'}}>SocialApp</h1>
        <div className="nav-links">
            <button className="nav-btn" onClick={() => setCurrentView("HOME")}>🏠 Home</button>
            <button className="nav-btn" onClick={() => setCurrentView("PROFILE")}>👤 Profile</button>
            <a href="http://localhost:3000/logout" className="logout-link">Logout</a>
        </div>
      </nav>

      <div className="feed">
        
        {/* VIEW: HOME */}
        {currentView === "HOME" && (
            <div className="post-card create-post-box">
                <h3>Create Post</h3>
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
        {currentView === "PROFILE" && (
            <div style={{textAlign: 'center', margin: '20px 0', color: '#555'}}>
                <h2>👤 My Profile</h2>
                <p>Viewing all posts (Filter logic requires API update)</p>
            </div>
        )}

        {/* FEED LIST */}
        {loading && <p className="loading">Loading...</p>}

        {posts.map((post) => (
          <div key={post._id} className="post-card">
            <div className="post-header">
                <div className="avatar">👤</div>
                <div className="username">@{post.username}</div>
                
                {/* Delete Button (Simple check: if I can delete, backend allows it) */}
                <button 
                    onClick={() => handleDelete(post._id)}
                    style={{marginLeft: 'auto', background: 'none', border: 'none', color: 'red', cursor: 'pointer'}}
                >
                    🗑️
                </button>
            </div>
            
            <p className="post-content">{post.content}</p>
            
            {post.image && (
              <div className="image-container">
                  <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Post" />
              </div>
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