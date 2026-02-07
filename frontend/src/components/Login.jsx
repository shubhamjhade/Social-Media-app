import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login({ setUser }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) { 
        setUser(data.user); 
        navigate("/"); 
      } else {
        setError(data.error);
      }
    } catch { 
      setError("Server connection failed"); 
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to continue to CampusXceptions</p>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '13px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="auth-input-group">
            <label className="auth-label">Username</label>
            <input 
              className="styled-input" 
              placeholder="Enter your username" 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              required 
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input 
              className="styled-input" 
              type="password" 
              placeholder="••••••••" 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '10px'}}>
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          Don't have an account? <Link to="/register" className="auth-link-text">Create Account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;