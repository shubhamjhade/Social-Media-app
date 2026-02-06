import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpeg";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("http://localhost:3000/logout", { method: "POST", credentials: "include" });
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Logo + Text Container */}
      <Link to="/" className="logo-link">
        <img src={logo} alt="CampusXceptions Logo" className="navbar-logo" />
        <span className="logo-text">CampusXceptions</span>
      </Link>

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