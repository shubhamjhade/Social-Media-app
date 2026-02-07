import { useEffect, useState } from "react";

function Profile({ user, setUser }) {
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: user.username || "", mobile: user.mobile || "" });

  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        // Robust filtering for user posts
        const myPosts = data.filter(p => 
            (p.userId === user.userId) || (p.user === user.userId) || p.username === user.username
        );
        setPosts(myPosts.reverse());
      });
  }, [user]);

  const handleSave = async () => {
    const res = await fetch("http://localhost:3000/api/user/update", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(formData)
    });
    const data = await res.json();
    if(data.success) { setUser(data.user); setIsEditing(false); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete?")) return;
    await fetch(`http://localhost:3000/delete/${id}`, { method: "DELETE", credentials: "include" });
    setPosts(posts.filter(p => p._id !== id));
  };

  return (
     <div className="card-panel" style={{textAlign:'center'}}>
        {/* Avatar */}
        <div className="user-avatar" style={{width:'80px', height:'80px', margin:'0 auto 20px', fontSize:'32px'}}>
            {user.username ? user.username[0].toUpperCase() : "U"}
        </div>

        {isEditing ? (
            <div style={{maxWidth:'300px', margin:'0 auto'}}>
                <input className="styled-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={{marginBottom:'10px'}}/>
                <input className="styled-input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} style={{marginBottom:'10px'}}/>
                <button onClick={handleSave} className="btn-primary" style={{marginRight:'10px'}}>Save</button>
                <button onClick={() => setIsEditing(false)} className="header-logout">Cancel</button>
            </div>
        ) : (
            <>
                <h2 style={{color:'white', margin:'0 0 5px'}}>@{user.username}</h2>
                <p style={{color:'#94a3b8', marginBottom:'20px'}}>+91 {user.mobile || "N/A"}</p>
                <button onClick={() => setIsEditing(true)} className="btn-primary">Edit Profile</button>
            </>
        )}

        <div style={{marginTop:'40px', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'20px'}}>
            <h3 style={{textAlign:'left', color:'#e0f2fe'}}>My Activity</h3>
            {posts.map(post => (
                <div key={post._id} style={{textAlign:'left', marginTop:'20px', background:'rgba(0,0,0,0.2)', padding:'15px', borderRadius:'16px'}}>
                    <div className="post-header-row">
                         <div className="user-group">
                            <div className="user-avatar" style={{width:'40px', height:'40px', fontSize:'16px'}}>
                                {post.username[0].toUpperCase()}
                            </div>
                            <span style={{color:'white', fontWeight:'700'}}>@{post.username}</span>
                         </div>
                         <button onClick={() => handleDelete(post._id)} className="delete-btn">🗑️</button>
                    </div>
                    <p className="post-content">{post.content}</p>
                    {post.image && <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Post"/>}
                </div>
            ))}
        </div>
     </div>
  );
}
export default Profile;