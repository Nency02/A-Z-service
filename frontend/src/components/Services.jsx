import React from "react";
import { Link } from "react-router-dom";
import { FaBroom, FaTools, FaBolt, FaLaptop, FaBug } from "react-icons/fa";

const services = [
  {
    name: "Home Cleaning",
    description: "Professional cleaning for homes and offices.",
    icon: <FaBroom />
  },
  {
    name: "Plumbing",
    description: "Expert plumbing solutions for all needs.",
    icon: <FaTools />
  },
  {
    name: "Electrician",
    description: "Certified electricians for repairs and installations.",
    icon: <FaBolt />
  },
  {
    name: "IT Support",
    description: "Technical support for computers and networks.",
    icon: <FaLaptop />
  },
  {
    name: "Pest Control",
    description: "Safe and effective pest management.",
    icon: <FaBug />
  }
];

function Services() {
  return (
    <section id="services" className="services-section">
      <h2>Our Services</h2>
      <div className="services-grid">
        {services.map((service, idx) => (
          <Link
            to={`/service/${encodeURIComponent(service.name)}`}
            key={idx}
            className="service-card"
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            <div className="service-icon">{service.icon}</div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Services;