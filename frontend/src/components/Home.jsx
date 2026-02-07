import { useEffect, useState, useRef } from "react";
import ThreadDiscussion from "./ThreadDiscussion";

function Home({ user }) {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  
  const [threads, setThreads] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [selectedThread, setSelectedThread] = useState(null); 

  const fileRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/posts", { credentials: "include" }).then(res => res.json()).then(setPosts);
    fetch("http://localhost:3000/api/threads", { credentials: "include" }).then(res => res.json()).then(setThreads);
  }, []);

  const handlePost = async () => {
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

  const createThread = async () => {
    if(!newTopic.trim()) return;
    const res = await fetch("http://localhost:3000/api/threads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ title: newTopic })
    });
    const data = await res.json();
    if(data.success) {
        setThreads([data.thread, ...threads]);
        setNewTopic("");
    }
  };

  if (selectedThread) return <ThreadDiscussion thread={selectedThread} user={user} onBack={() => setSelectedThread(null)} />;

  return (
    <div>
      <div className="nav-tabs" style={{display:'flex', justifyContent:'center', gap:'20px', marginBottom:'30px'}}>
          <button className="btn-primary" style={{background: activeTab === 'posts' ? 'var(--grad-primary)' : 'rgba(255,255,255,0.05)'}} onClick={() => setActiveTab('posts')}>FEED</button>
          <button className="btn-primary" style={{background: activeTab === 'threads' ? 'var(--grad-primary)' : 'rgba(255,255,255,0.05)'}} onClick={() => setActiveTab('threads')}>THREADS</button>
      </div>

      {activeTab === 'posts' && (
        <>
            <div className="card-panel">
                <textarea className="styled-input" placeholder="What's happening?" value={content} onChange={e=>setContent(e.target.value)} />
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <input type="file" ref={fileRef} onChange={e=>setImage(e.target.files[0])} style={{color:'#94a3b8'}}/>
                    <button onClick={handlePost} className="btn-primary">POST</button>
                </div>
            </div>
            {posts.map(post => (
                <div key={post._id} className="card-panel">
                    <div className="post-header-row">
                        <div className="user-group">
                            <div className="user-avatar">{post.username?.[0].toUpperCase()}</div>
                            <div className="user-text"><h3>@{post.username}</h3><span>Just now</span></div>
                        </div>
                    </div>
                    <p className="post-content">{post.content}</p>
                    {post.image && <img src={`http://localhost:3000/uploads/${post.image}`} className="post-image" alt="Post" />}
                </div>
            ))}
        </>
      )}

      {activeTab === 'threads' && (
        <>
            <div className="card-panel" style={{borderTop:'2px solid #ec4899'}}>
                <h3 style={{color:'#ec4899', marginTop:0}}>Start a Discussion</h3>
                <input className="styled-input" placeholder="Enter topic name..." value={newTopic} onChange={e => setNewTopic(e.target.value)} />
                <button onClick={createThread} className="btn-primary" style={{marginTop:'10px', width:'100%', background:'linear-gradient(135deg, #ec4899, #8b5cf6)'}}>CREATE THREAD</button>
            </div>
            {threads.map(thread => (
                <div key={thread._id} className="card-panel" style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:'4px solid #00f2ff'}}>
                    <div className="thread-info">
                        <h3 style={{fontSize:'18px', margin:'0 0 5px', color:'white'}}>{thread.title}</h3>
                        <span style={{fontSize:'12px', color:'#94a3b8'}}>Started by @{thread.username}</span>
                    </div>
                    <button onClick={() => setSelectedThread(thread)} className="btn-primary" style={{padding:'8px 20px', fontSize:'12px', background:'rgba(0, 242, 255, 0.15)', color:'#00f2ff', border:'1px solid #00f2ff', boxShadow:'none'}}>
                        ENTER
                    </button>
                </div>
            ))}
        </>
      )}
    </div>
  );
}
export default Home;