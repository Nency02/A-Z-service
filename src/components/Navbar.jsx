import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import "./Navbar.css";
import BookServiceModal from "./BookServiceModal";

function Navbar() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();

  const handleLogout = () => {
    logout();
    showNotification("You have been logged out successfully.", "info");
    navigate("/");
  };

  const handleNavigation = (sectionId) => {
    // If we're on the home page, scroll to section
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on a different page, navigate to home and then scroll
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Left - Logo */}
          <span className="navbar-logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            A-Z Globe Gujarat
          </span>

          {/* Center - Links */}
          <ul className="navbar-links">
            <li><button onClick={() => handleNavigation("hero")} className="nav-link">Home</button></li>
            <li><button onClick={() => handleNavigation("about")} className="nav-link">About</button></li>
            <li><button onClick={() => handleNavigation("services")} className="nav-link">Services</button></li>
            <li><button onClick={() => handleNavigation("contact")} className="nav-link">Contact</button></li>
          </ul>

          {/* Right - Buttons */}
          <div className="navbar-actions">
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              Book Service
            </button>
            
            {user ? (
              // Show user menu when logged in
              <div className="user-menu">
                <span className="user-name">Welcome, {user.name}</span>
                <button className="btn-outline" onClick={() => navigate("/profile")}>
                  Profile
                </button>
                <button className="btn-outline" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              // Show login/signup buttons when not logged in
              <>
                <button className="btn-outline" onClick={() => navigate("/login")}>
                  Login
                </button>
                <button className="btn-outline" onClick={() => navigate("/signup")}>
                  Signup
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Book Service Modal */}
      <BookServiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export default Navbar;
