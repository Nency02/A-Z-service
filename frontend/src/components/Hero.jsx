import React from "react";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  const handleExploreServices = () => {
    const element = document.getElementById("services");
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="hero-section">
      <div className="hero-content">
        <h1>A-Z Service</h1>
        <p>
          Leading multi-services provider in Gujarat. Fast, reliable, and quality-assured services for everyone!
        </p>
        <button onClick={handleExploreServices} className="hero-btn">Explore Services</button>
      </div>
    </section>
  );
}

export default Hero;