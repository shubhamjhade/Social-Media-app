import { useEffect, useState, useRef } from "react";

function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  
  // State for inputs and visibility
  const [commentText, setCommentText] = useState({});
  const [activeCommentBox, setActiveCommentBox] = useState({});
  
  const fileRef = useRef(null);

  // Fetch Posts
  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error("Error fetching posts:", err));
  }, []);

  // --- HANDLE POST ---
  const handlePost = async (e) => {
    e.preventDefault();
    if(!content && !image) return;
    
    const form = new FormData();
    form.append("content", content);
    if(image) form.append("image", image);
    
    try {
        const res = await fetch("http://localhost:3000/posting", { method: "POST", credentials: "include", body: form });
        const data = await res.json();
        if(data.success) {
           // Safely add new post to top of list
           setPosts([{...data.post, likes: [], comments: []}, ...posts]);
           setContent(""); setImage(null); fileRef.current.value = "";
        }
    } catch(err) { console.error(err); }
  };

  // --- HANDLE LIKE ---
  const handleLike = async (id) => {
    try {
        const res = await fetch(`http://localhost:3000/like/${id}`, { credentials: "include" });
        const data = await res.json();
        if(data.success) {
            setPosts(posts.map(p => p._id === id ? { ...p, likes: data.likes } : p));
        }
    } catch(err) { console.error(err); }
  };

  // --- HANDLE COMMENT (FIXED) ---
  const handleComment = async (postId) => {
    const text = commentText[postId];
    if(!text) return;

    try {
        const res = await fetch(`http://localhost:3000/comment/${postId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        
        if(data.success) {
            // ROBUST UPDATE: Handle if server returns full list OR single comment
            setPosts(posts.map(p => {
                if (p._id === postId) {
                    // If server returned a 'comments' array, use it. 
                    // If it returned a single 'comment' object, append it.
                    const updatedComments = data.comments 
                        ? data.comments 
                        : [...(p.comments || []), data.comment]; 
                    
                    return { ...p, comments: updatedComments };
                }
                return p;
            }));
            setCommentText({ ...commentText, [postId]: "" }); // Clear input
        }
    } catch(err) { console.error("Comment failed:", err); }
  };

  const toggleComments = (postId) => {
    setActiveCommentBox(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete post?")) return;
    await fetch(`http://localhost:3000/delete/${id}`, { method: "DELETE", credentials: "include" });
    setPosts(posts.filter(p => p._id !== id));
  };

  return (
    <div>
      {/* Create Box */}
      <div className="card-panel">
        <textarea 
           className="styled-input" 
           placeholder="What's happening?" 
           value={content} 
           onChange={e=>setContent(e.target.value)} 
        />
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <input type="file" ref={fileRef} onChange={e=>setImage(e.target.files[0])} style={{color:'#888', fontSize:'12px'}}/>
           <button onClick={handlePost} className="btn-primary">Post</button>
        </div>
      </div>

      {/* Feed */}
      {posts.map(post => (
        <div key={post._id} className="card-panel">
           
           {/* Header */}
           <div className="post-header-row">
              <div className="user-group">
                 <div className="user-avatar">
                    {post.username ? post.username[0].toUpperCase() : "U"}
                 </div>
                 <div className="user-text">
                    <h3>@{post.username}</h3>
                    <span>Just now</span>
                 </div>
              </div>
              
              {(user.isAdmin || user.username === post.username) && (
                 <button onClick={() => handleDelete(post._id)} className="delete-btn">🗑️</button>
              )}
           </div>
           
           {/* Content */}
           <p className="post-content">{post.content}</p>
           {post.image && <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Post" />}
           
           {/* Actions */}
           <div className="action-row">
              <button 
                 onClick={() => handleLike(post._id)} 
                 className={`action-item ${post.likes.includes(user.userId) ? 'liked' : ''}`}
              >
                 {post.likes.includes(user.userId) ? "❤️" : "🤍"} {post.likes.length}
              </button>
              
              <button className="action-item" onClick={() => toggleComments(post._id)}>
                 💬 {post.comments ? post.comments.length : 0} Comments
              </button>
           </div>

           {/* Comments Section */}
           {activeCommentBox[post._id] && (
               <div className="comment-container">
                   <div className="comment-list">
                       {(post.comments && post.comments.length > 0) ? (
                           post.comments.map((c, i) => (
                               <div key={i} className="comment-bubble">
                                   <span className="comment-author">@{c.username || "User"}</span>
                                   <span className="comment-text">{c.text}</span>
                               </div>
                           ))
                       ) : (
                           <p style={{color:'#666', fontSize:'13px', textAlign:'center'}}>No comments yet.</p>
                       )}
                   </div>

                   <div className="comment-input-wrapper">
                       <input 
                           className="comment-input"
                           placeholder="Write a comment..."
                           value={commentText[post._id] || ""}
                           onChange={(e) => setCommentText({...commentText, [post._id]: e.target.value})}
                           onKeyDown={(e) => e.key === 'Enter' && handleComment(post._id)}
                       />
                       <button className="comment-send-btn" onClick={() => handleComment(post._id)}>➤</button>
                   </div>
               </div>
           )}

        </div>
      ))}
    </div>
  );
}
export default Home;