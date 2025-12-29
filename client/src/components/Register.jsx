import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({ username: "", password: "", fullName: "", mobile: "" });
  const [msg, setMsg] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    });
    const data = await res.json();
    setMsg(data.error || data.message);
  };

  return (
      <div className="auth-box">
          <h2>Register</h2>
          {msg && <p style={{color:'blue'}}>{msg}</p>}
          <form onSubmit={handleSubmit}>
              <input placeholder="Username" onChange={(e)=>setFormData({...formData, username:e.target.value})} required />
              <input type="password" placeholder="Password" onChange={(e)=>setFormData({...formData, password:e.target.value})} required />
              <input placeholder="Full Name" onChange={(e)=>setFormData({...formData, fullName:e.target.value})} required />
              <input placeholder="Mobile" onChange={(e)=>setFormData({...formData, mobile:e.target.value})} required />
              <button type="submit">Sign Up</button>
          </form>
          <p><Link to="/login">Back to Login</Link></p>
      </div>
  )
}

export default Register;