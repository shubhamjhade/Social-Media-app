import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("http://localhost:3000/logout", { method: "POST", credentials: "include" });
    setUser(null);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path ? "header-link active" : "header-link";

  return (
    <>
      <header className="main-header">
        {/* LEFT: Brand */}
        <div className="header-brand">CampusXceptions</div>

        {/* RIGHT (Desktop): Links & Logout */}
        <nav className="desktop-nav">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/profile" className={isActive('/profile')}>Profile</Link>
          {user?.isAdmin && <Link to="/admin" className={isActive('/admin')}>Admin</Link>}
          <button onClick={handleLogout} className="header-logout">Logout</button>
        </nav>

        {/* RIGHT (Mobile): Hamburger */}
        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
           {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* MOBILE DROPDOWN */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="mobile-link" onClick={()=>setMenuOpen(false)}>Home</Link>
          <Link to="/profile" className="mobile-link" onClick={()=>setMenuOpen(false)}>Profile</Link>
          {user?.isAdmin && <Link to="/admin" className="mobile-link" onClick={()=>setMenuOpen(false)}>Admin</Link>}
          
          <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="mobile-logout">
            Logout
          </button>
      </div>
    </>
  );
}
export default Navbar;