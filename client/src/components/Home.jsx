import { useEffect, useState, useRef } from "react";

function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  
  // NEW: Store text for comment inputs. Key = postId, Value = text
  const [commentTexts, setCommentTexts] = useState({}); 
  
  const fileInputRef = useRef(null);

  // 1. Fetch Posts
  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" })
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error(err));
  }, []);

  // 2. Create Post Logic
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent && !newImage) return;

    const formData = new FormData();
    formData.append("content", newContent);
    if (newImage) formData.append("image", newImage);

    try {
      const res = await fetch("http://localhost:3000/posting", {
          method: "POST",
          credentials: "include",
          body: formData
      });
      const data = await res.json();
      if (data.success) {
          // Add new post to top (initialize comments array to avoid crash)
          const safePost = { ...data.post, likes: [], comments: [] };
          setPosts([safePost, ...posts]);
          
          // Reset form
          setNewContent("");
          setNewImage(null);
          fileInputRef.current.value = "";
      }
    } catch (err) { console.error(err); }
  };

  // 3. Like Logic
  const handleLike = async (postId) => {
      const res = await fetch(`http://localhost:3000/like/${postId}`, { credentials: "include" });
      const data = await res.json();
      if(data.success) {
          setPosts(posts.map(p => p._id === postId ? { ...p, likes: data.likes } : p));
      }
  };

  // 4. Delete Post Logic
  const handleDelete = async (postId) => {
      if(!window.confirm("Delete this post?")) return;
      const res = await fetch(`http://localhost:3000/delete/${postId}`, { method: "DELETE", credentials: "include" });
      if(res.ok) setPosts(posts.filter(p => p._id !== postId));
  };

  // 5. NEW: Add Comment Logic
  const handleComment = async (e, postId) => {
      e.preventDefault();
      const text = commentTexts[postId];
      if(!text) return;

      const res = await fetch(`http://localhost:3000/comment/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text })
      });
      const data = await res.json();

      if(data.success) {
          // Update the specific post with the new comment
          setPosts(posts.map(p => {
              if (p._id === postId) {
                  return { ...p, comments: [...p.comments, data.comment] };
              }
              return p;
          }));
          // Clear input for this post
          setCommentTexts({ ...commentTexts, [postId]: "" });
      }
  };

  return (
    <div className="feed">
      {/* Create Post Box */}
      <div className="post-card create-box">
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

      {/* Feed List */}
      {posts.map(post => (
          <div key={post._id} className="post-card">
              <div className="post-header">
                  <div className="post-user-info">
                    <div className="avatar">👤</div>
                    <strong>@{post.username}</strong>
                  </div>
                  
                  {/* Delete Button (Only if Admin or Author) */}
                  {(user.isAdmin || user.username === post.username) && 
                      <button onClick={() => handleDelete(post._id)} className="delete-btn">🗑️</button>
                  }
              </div>

              <p className="post-text">{post.content}</p>

              {post.image && (
                  <div className="image-container">
                    <img src={`http://localhost:3000/uploads/${post.image}`} className="post-img" alt="Post content" />
                  </div>
              )}

              <div className="actions">
                  <button onClick={() => handleLike(post._id)} className="btn-like">
                      {post.likes.includes(user.userId) ? "❤️" : "🤍"} {post.likes.length} Likes
                  </button>
              </div>

              {/* NEW: Comment Section */}
              <div className="comments-section">
                  <div className="comments-list">
                      {post.comments && post.comments.map(comment => (
                          <div key={comment._id} className="comment-item">
                              <span className="comment-user">{comment.username}: </span>
                              <span>{comment.text}</span>
                          </div>
                      ))}
                  </div>
                  
                  <form className="comment-form" onSubmit={(e) => handleComment(e, post._id)}>
                      <input 
                          type="text" 
                          placeholder="Write a comment..." 
                          value={commentTexts[post._id] || ""}
                          onChange={(e) => setCommentTexts({...commentTexts, [post._id]: e.target.value})}
                      />
                      <button type="submit">Post</button>
                  </form>
              </div>

          </div>
      ))}
    </div>
  );
}

export default Home;