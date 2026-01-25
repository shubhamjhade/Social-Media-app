import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Import our components
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Admin from "./components/Admin";
import Profile from "./components/Profile"; // New Profile Component

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in when app starts
  useEffect(() => {
    fetch("http://localhost:3000/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading SocialApp...</div>;

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Show Navbar only if logged in */}
        {user && <Navbar user={user} setUser={setUser} />}

        <Routes>
          {/* If not logged in, force to Login */}
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.isAdmin ? <Admin /> : <Navigate to="/" />} />
          
          {/* Updated Profile Route */}
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;