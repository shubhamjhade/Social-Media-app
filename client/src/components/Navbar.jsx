import { Link, useNavigate } from "react-router-dom";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("http://localhost:3000/logout", { method: "POST", credentials: "include" });
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <span className="logo">SocialApp</span>
      <div className="nav-links">
        <Link to="/">🏠 Home</Link>
        {user.isAdmin && <Link to="/admin">👑 Admin</Link>}
        <Link to="/profile">👤 Profile</Link>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;