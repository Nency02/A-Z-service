import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import BookServiceModal from "./BookServiceModal";

function Navbar() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">

          {/* Left - Logo */}
          <span className="navbar-logo">A-Z Globe Gujarat</span>

          {/* Center - Links */}
          <ul className="navbar-links">
            <li><a href="#hero">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          {/* Right - Buttons */}
          <div className="navbar-actions">
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              Book Service
            </button>
            <button className="btn-outline" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="btn-outline" onClick={() => navigate("/signup")}>
              Signup
            </button>
          </div>
        </div>
      </nav>

      {/* Book Service Modal */}
      <BookServiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export default Navbar;
