import { useEffect, useState } from "react";

function Profile({ user, setUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // EDIT MODE STATE
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      username: user.username,
      mobile: user.mobile || "" 
  });

  // 1. Fetch Posts
  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const myPosts = data.filter(p => p.username === user.username);
        setPosts(myPosts);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [user.username]); // Re-fetch if username changes

  // 2. Handle Edit Input Change
  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Save Profile Changes
  const handleSave = async () => {
      const res = await fetch("http://localhost:3000/api/user/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
          alert("Profile Updated!");
          setUser(data.user); // Update global user state
          setIsEditing(false); // Exit edit mode
      } else {
          alert(data.error);
      }
  };

  const handleDelete = async (postId) => {
      if(!window.confirm("Delete this post?")) return;
      const res = await fetch(`http://localhost:3000/delete/${postId}`, { method: "DELETE", credentials: "include" });
      if(res.ok) setPosts(posts.filter(p => p._id !== postId));
  };

  return (
    <div className="feed">
      {/* PROFILE HEADER CARD */}
      <div className="post-card profile-header-card">
          <div className="profile-avatar-large">👤</div>
          
          {/* TOGGLE: Show Inputs if Editing, otherwise show Text */}
          {isEditing ? (
              <div className="edit-form">
                  <input 
                      type="text" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleChange} 
                      placeholder="Username"
                      className="edit-input"
                  />
                  <input 
                      type="text" 
                      name="mobile" 
                      value={formData.mobile} 
                      onChange={handleChange} 
                      placeholder="Phone Number"
                      className="edit-input"
                  />
                  <div className="edit-buttons">
                      <button onClick={handleSave} className="save-btn">💾 Save</button>
                      <button onClick={() => setIsEditing(false)} className="cancel-btn">❌ Cancel</button>
                  </div>
              </div>
          ) : (
              <div>
                  <h2>@{user.username}</h2>
                  <p style={{color:'#777'}}>📞 {user.mobile || "No phone added"}</p>
                  <p className="profile-stats"><strong>{posts.length}</strong> Posts created</p>
                  {user.isAdmin && <span className="admin-badge">👑 Administrator</span>}
                  
                  <button onClick={() => setIsEditing(true)} className="edit-btn">✏️ Edit Profile</button>
              </div>
          )}
      </div>

      <h3 style={{marginTop: '20px', color: '#555'}}>My Posts</h3>

      {loading && <p>Loading...</p>}
      {posts.length === 0 && !loading && <p>You haven't posted anything yet.</p>}

      {posts.map(post => (
          <div key={post._id} className="post-card">
              <div className="post-header">
                  <strong>@{post.username}</strong>
                  <button onClick={() => handleDelete(post._id)} className="delete-btn">🗑️</button>
              </div>
              <p>{post.content}</p>
              {post.image && (
                  <div className="image-container">
                    <img src={`http://localhost:3000/uploads/${post.image}`} className="post-img" />
                  </div>
              )}
              <div className="actions">
                  <span className="like-count">❤️ {post.likes.length} Likes</span>
              </div>
          </div>
      ))}
    </div>
  );
}

export default Profile;