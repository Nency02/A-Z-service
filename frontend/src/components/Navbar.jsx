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
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <span
            className="navbar-logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            A-Z Service
          </span>

          {/* Navigation Links */}
          <ul className="navbar-links">
            <li>
              <button
                onClick={() => handleNavigation("hero")}
                className="nav-link"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation("about")}
                className="nav-link"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation("services")}
                className="nav-link"
              >
                Services
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation("contact")}
                className="nav-link"
              >
                Contact
              </button>
            </li>
          </ul>

          {/* Role-based Buttons */}
          <div className="navbar-actions">
            {/* Customer: Book Service */}
            {user && user.role === "customer" && (
              <button
                className="btn-primary"
                onClick={() => setModalOpen(true)}
              >
                Book Service
              </button>
            )}

            {/* Provider: Dashboard */}
            {user && user.role === "provider" && (
              <button
                className="btn-primary"
                onClick={() => navigate("/provider/dashboard")}
              >
                Provider Dashboard
              </button>
            )}

            {/* Profile Button */}
            {user && (
              <button
                className="btn-outline"
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>
            )}

            {/* Logout / Login / Signup */}
            {user ? (
              <button className="btn-outline" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <>
                <button
                  className="btn-outline"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
                <button
                  className="btn-outline"
                  onClick={() => navigate("/signup")}
                >
                  Signup
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Book Service Modal */}
      {user && user.role === "customer" && (
        <BookServiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

export default Navbar;
