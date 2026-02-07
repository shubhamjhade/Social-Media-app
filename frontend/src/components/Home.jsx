import { useEffect, useState, useRef } from "react";

function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  
  // Comment States
  const [commentText, setCommentText] = useState({});
  const [activeCommentBox, setActiveCommentBox] = useState({});
  
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json()).then(data => setPosts(data))
      .catch(err => console.error(err));
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if(!content && !image) return;
    const form = new FormData();
    form.append("content", content);
    if(image) form.append("image", image);
    
    const res = await fetch("http://localhost:3000/posting", { method: "POST", credentials: "include", body: form });
    const data = await res.json();
    if(data.success) {
       setPosts([{...data.post, likes: [], comments: []}, ...posts]);
       setContent(""); setImage(null); fileRef.current.value = "";
    }
  };

  const handleLike = async (id) => {
    const res = await fetch(`http://localhost:3000/like/${id}`, { credentials: "include" });
    const data = await res.json();
    if(data.success) setPosts(posts.map(p => p._id === id ? { ...p, likes: data.likes } : p));
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if(!text) return;

    const res = await fetch(`http://localhost:3000/comment/${postId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ text })
    });
    const data = await res.json();
    if(data.success) {
        // Handle varying server response structure
        setPosts(posts.map(p => {
             if(p._id === postId) {
                 const newComments = data.comments ? data.comments : [...(p.comments || []), data.comment];
                 return { ...p, comments: newComments };
             }
             return p;
        }));
        setCommentText({ ...commentText, [postId]: "" });
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete post?")) return;
    await fetch(`http://localhost:3000/delete/${id}`, { method: "DELETE", credentials: "include" });
    setPosts(posts.filter(p => p._id !== id));
  };

  return (
    <div>
      {/* INPUT CARD */}
      <div className="card-panel">
        <textarea 
           className="styled-input" 
           placeholder="What's happening?" 
           value={content} 
           onChange={e=>setContent(e.target.value)} 
        />
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <input type="file" ref={fileRef} onChange={e=>setImage(e.target.files[0])} style={{color:'#94a3b8', fontSize:'13px'}}/>
           <button onClick={handlePost} className="btn-primary">Post</button>
        </div>
      </div>

      {/* FEED */}
      {posts.map(post => (
        <div key={post._id} className="card-panel">
           
           {/* HEADER */}
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
           
           {/* CONTENT */}
           <p className="post-content">{post.content}</p>
           {post.image && <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Post" />}
           
           {/* ACTIONS */}
           <div className="action-row">
              <button 
                 onClick={() => handleLike(post._id)} 
                 className={`action-item ${post.likes.includes(user.userId) ? 'liked' : ''}`}
              >
                 {post.likes.includes(user.userId) ? "❤️" : "🤍"} {post.likes.length}
              </button>
              
              <button className="action-item" onClick={() => setActiveCommentBox(prev => ({...prev, [post._id]: !prev[post._id]}))}>
                 💬 {post.comments ? post.comments.length : 0}
              </button>
           </div>

           {/* COMMENTS */}
           {activeCommentBox[post._id] && (
               <div className="comment-container">
                   <div className="comment-list">
                       {post.comments && post.comments.map((c, i) => (
                           <div key={i} className="comment-bubble">
                               <span className="comment-author">@{c.username}</span>
                               <span style={{color:'#e2e8f0'}}>{c.text}</span>
                           </div>
                       ))}
                   </div>
                   <div className="comment-input-wrapper">
                       <input 
                           className="comment-input"
                           placeholder="Write a comment..."
                           value={commentText[post._id] || ""}
                           onChange={(e) => setCommentText({...commentText, [post._id]: e.target.value})}
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