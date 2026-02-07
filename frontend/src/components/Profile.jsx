import { useEffect, useState } from "react";

function Profile({ user, setUser }) {
  const [activeTab, setActiveTab] = useState("posts");
  const [myPosts, setMyPosts] = useState([]);
  const [myThreads, setMyThreads] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: user.username || "", mobile: user.mobile || "" });

  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setMyPosts(data.filter(p => p.userId === user.userId || p.username === user.username).reverse());
      });

    fetch("http://localhost:3000/api/threads", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setMyThreads(data.filter(t => t.userId === user.userId));
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

  return (
     <div className="card-panel" style={{textAlign:'center', minHeight:'600px'}}>
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

        <div className="nav-tabs" style={{marginTop:'40px', gap:'10px'}}>
             <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={()=>setActiveTab('posts')} style={{padding:'10px 20px', fontSize:'13px'}}>Posts</button>
             <button className={`tab-btn ${activeTab === 'threads' ? 'active' : ''}`} onClick={()=>setActiveTab('threads')} style={{padding:'10px 20px', fontSize:'13px'}}>My Threads</button>
        </div>

        <div style={{marginTop:'20px', textAlign:'left'}}>
            {activeTab === 'posts' && (
                <div>
                    {myPosts.length === 0 && <p style={{textAlign:'center', color:'#555'}}>No posts yet.</p>}
                    {myPosts.map(post => (
                        <div key={post._id} style={{marginBottom:'15px', background:'rgba(255,255,255,0.03)', padding:'15px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.05)'}}>
                            <p style={{margin:0, color:'#ccc'}}>{post.content}</p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'threads' && (
                <div>
                    {myThreads.length === 0 && <p style={{textAlign:'center', color:'#555'}}>No threads created.</p>}
                    {myThreads.map(thread => (
                        <div key={thread._id} style={{marginBottom:'15px', background:'rgba(0, 242, 255, 0.05)', padding:'15px', borderRadius:'12px', border:'1px solid rgba(0, 242, 255, 0.2)'}}>
                            <h4 style={{margin:'0 0 5px', color:'#00f2ff'}}>{thread.title}</h4>
                            <span style={{fontSize:'12px', color:'#888'}}>Open Discussion</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
     </div>
  );
}
export default Profile;