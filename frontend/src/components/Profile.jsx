import { useEffect, useState } from "react";

function Profile({ user, setUser }) {
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    username: user.username || "", 
    mobile: user.mobile || "" 
  });

  // Fetch posts and filter for the current user
  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        // ROBUST FILTER: Matches by ID (if available) OR Username
        // This fixes the issue where changing your name hides old posts
        const myPosts = data.filter(p => 
            (p.userId && p.userId === user.userId) || // Match by User ID (Best)
            (p.user && p.user === user.userId) ||     // Alternative ID field
            p.username === user.username              // Fallback to Username string
        );
        setPosts(myPosts.reverse()); // Show newest first
      })
      .catch(err => console.error(err));
  }, [user]);

  // Handle Profile Update
  const handleSave = async () => {
    try {
        const res = await fetch("http://localhost:3000/api/user/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(formData)
        });
        
        const data = await res.json();
        
        if(data.success) {
            setUser(data.user); 
            setIsEditing(false);
            alert("✅ Profile updated!");
        } else {
            alert("❌ Error: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Server Error");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this post?")) return;
    await fetch(`http://localhost:3000/delete/${id}`, { method: "DELETE", credentials: "include" });
    setPosts(posts.filter(p => p._id !== id));
  };

  return (
     <div className="card-panel" style={{textAlign:'center', marginTop:'20px'}}>
        
        {/* --- PROFILE HEADER --- */}
        <div style={{
            width:'100px', height:'100px', margin:'0 auto 20px', borderRadius:'50%', 
            border:'3px solid #3b82f6', display:'flex', alignItems:'center', 
            justifyContent:'center', fontSize:'40px', background:'#252525', color:'#fff'
        }}>
            {user.username ? user.username[0].toUpperCase() : "U"}
        </div>

        {isEditing ? (
            /* EDIT MODE */
            <div style={{maxWidth:'300px', margin:'0 auto'}}>
                <label style={{textAlign:'left', display:'block', color:'#888', fontSize:'12px', marginBottom:'5px'}}>Username</label>
                <input 
                   className="styled-input" 
                   value={formData.username} 
                   onChange={e => setFormData({...formData, username: e.target.value})} 
                />
                
                <label style={{textAlign:'left', display:'block', color:'#888', fontSize:'12px', marginBottom:'5px'}}>Mobile</label>
                <input 
                   className="styled-input" 
                   value={formData.mobile} 
                   onChange={e => setFormData({...formData, mobile: e.target.value})} 
                />
                
                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                   <button onClick={handleSave} className="btn-primary" style={{background:'#10b981', flex:1}}>Save</button>
                   <button onClick={() => setIsEditing(false)} className="btn-primary" style={{background:'#333', flex:1}}>Cancel</button>
                </div>
            </div>
        ) : (
            /* VIEW MODE */
            <>
                <h2 style={{fontSize:'28px', margin:'0 0 5px 0', color:'white'}}>@{user.username}</h2>
                <p style={{color:'#888', marginBottom:'20px'}}>+91 {user.mobile || "N/A"}</p>
                
                <div style={{display:'flex', justifyContent:'center', gap:'10px', marginBottom:'25px'}}>
                   <span style={{background:'#333', padding:'6px 15px', borderRadius:'20px', fontSize:'12px', color:'#ccc'}}>
                      {posts.length} Posts
                   </span>
                   {user.isAdmin && (
                       <span style={{background:'#1e3a8a', padding:'6px 15px', borderRadius:'20px', fontSize:'12px', color:'white'}}>
                          Administrator
                       </span>
                   )}
                </div>
                
                <button onClick={() => setIsEditing(true)} className="btn-primary">Edit Profile</button>
            </>
        )}

        {/* --- MY ACTIVITY FEED (Fixed UI) --- */}
        <h3 style={{textAlign:'left', marginTop:'40px', borderBottom:'1px solid #333', paddingBottom:'15px', color:'#eee'}}>
            My Activity
        </h3>
        
        {posts.length === 0 && <p style={{color:'#555', marginTop:'30px'}}>No posts found.</p>}

        <div style={{marginTop:'20px'}}>
            {posts.map(post => (
                <div key={post._id} className="card-panel" style={{textAlign:'left', padding:'20px', marginBottom:'20px'}}>
                    
                    {/* Post Header */}
                    <div className="post-header-row" style={{marginBottom:'15px'}}>
                        <div className="user-group">
                            <div className="user-avatar">
                                {post.username ? post.username[0].toUpperCase() : "U"}
                            </div>
                            <div className="user-text">
                                <h3>@{post.username}</h3>
                                <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(post._id)} className="delete-btn">🗑️</button>
                    </div>

                    {/* Content */}
                    <p className="post-content">{post.content}</p>
                    {post.image && <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Post" />}

                    {/* Stats */}
                    <div style={{display:'flex', gap:'15px', marginTop:'15px', borderTop:'1px solid #222', paddingTop:'15px'}}>
                        <span style={{color:'#888', fontSize:'13px'}}>❤️ {post.likes.length} Likes</span>
                        <span style={{color:'#888', fontSize:'13px'}}>💬 {post.comments ? post.comments.length : 0} Comments</span>
                    </div>
                </div>
            ))}
        </div>
     </div>
  );
}
export default Profile;