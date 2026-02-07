import { useEffect, useState, useRef } from "react";

function ThreadDiscussion({ thread, user, onBack }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`http://localhost:3000/api/threads/${thread._id}/posts`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [thread._id]);

  const handlePost = async () => {
    const form = new FormData();
    form.append("content", content);
    if(image) form.append("image", image);

    const res = await fetch(`http://localhost:3000/api/threads/${thread._id}/posts`, {
        method: "POST",
        credentials: "include",
        body: form
    });
    const data = await res.json();
    if(data.success) {
        setPosts([data.post, ...posts]);
        setContent(""); setImage(null); fileRef.current.value = "";
    }
  };

  return (
    <div>
        {/* Header Back Button */}
        <button onClick={onBack} style={{background:'transparent', border:'none', color:'#ccc', marginBottom:'15px', cursor:'pointer', fontSize:'14px'}}>
            ← Back to Topics
        </button>

        {/* Topic Title Banner */}
        <div className="card-panel" style={{textAlign:'center', border:'1px solid #00f2ff', background:'rgba(0, 242, 255, 0.05)'}}>
            <h1 style={{margin:0, color:'#00f2ff', fontSize:'24px', textTransform:'uppercase', letterSpacing:'2px'}}>
                {thread.title}
            </h1>
            <p style={{color:'#888', margin:'5px 0 0'}}>Discussion Zone</p>
        </div>

        {/* Input Area (Same UI as Feed) */}
        <div className="card-panel">
            <textarea 
                className="styled-input" 
                placeholder={`Discuss ${thread.title}...`} 
                value={content} 
                onChange={e=>setContent(e.target.value)} 
            />
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <input type="file" ref={fileRef} onChange={e=>setImage(e.target.files[0])} style={{color:'#94a3b8'}}/>
                <button onClick={handlePost} className="btn-primary">Send</button>
            </div>
        </div>

        {/* Thread Posts */}
        {posts.map(post => (
            <div key={post._id} className="card-panel" style={{borderLeft:'3px solid #00f2ff'}}>
                <div className="post-header-row">
                    <div className="user-group">
                        <div className="user-avatar" style={{width:'40px', height:'40px', fontSize:'16px'}}>
                            {post.username?.[0].toUpperCase()}
                        </div>
                        <div className="user-text">
                            <h3 style={{fontSize:'16px'}}>@{post.username}</h3>
                            <span style={{fontSize:'11px'}}>Thread Contributor</span>
                        </div>
                    </div>
                </div>
                <p className="post-content">{post.content}</p>
                {post.image && <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Thread Post" />}
            </div>
        ))}
    </div>
  );
}

export default ThreadDiscussion;