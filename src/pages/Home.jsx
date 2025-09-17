import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaTools, FaUserTie, FaHome, FaBirthdayCake } from "react-icons/fa";
import "./Home.css";

const Home = () => {
  const [selectedCity, setSelectedCity] = useState("");

  const cities = ["Ahmedabad", "Surat", "Rajkot", "Vadodara"];

  const services = {
    Ahmedabad: ["Plumber", "Electrician", "Cleaning", "Catering"],
    Surat: ["IT Services", "Marketing", "Fitness Trainers", "Photographers"],
    Rajkot: ["Salon", "Tutors", "Event Decor", "Printing"],
    Vadodara: ["Health", "Catering", "Home Repair", "Photography"],
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="overlay">
          <h1>Welcome to A-Z Globe Gujarat</h1>
          <p>One-stop solution for all your service needs in Gujarat 🚀</p>
          <Link to="/services" className="btn-primary">
            Explore Services
          </Link>
        </div>
      </section>

      {/* Services Categories */}
      <section className="services-section">
        <h3 className="section-title">Our Services</h3>
        <div className="services-grid">
          <div className="service-card">
            <FaTools className="service-icon" />
            <h4>Home Services</h4>
            <p>Plumber, Electrician, Cleaning</p>
          </div>
          <div className="service-card">
            <FaUserTie className="service-icon" />
            <h4>Business Services</h4>
            <p>IT, Marketing, Printing</p>
          </div>
          <div className="service-card">
            <FaHome className="service-icon" />
            <h4>Personal Services</h4>
            <p>Salon, Fitness, Tutors</p>
          </div>
          <div className="service-card">
            <FaBirthdayCake className="service-icon" />
            <h4>Event Services</h4>
            <p>Catering, Photography, Decor</p>
          </div>
        </div>
      </section>

      {/* City-wise Services */}
      <section className="city-section">
        <h3 className="section-title">Services by City</h3>
        <div className="city-buttons">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`city-btn ${selectedCity === city ? "active" : ""}`}
            >
              {city}
            </button>
          ))}
        </div>

        {selectedCity && (
          <div className="city-services">
            <h4>{selectedCity} Services</h4>
            <ul>
              {services[selectedCity].map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
