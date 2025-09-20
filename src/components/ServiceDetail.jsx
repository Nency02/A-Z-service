import React from "react";
import { useParams, Link } from "react-router-dom";
import { FaBroom, FaTools, FaBolt, FaLaptop, FaBug } from "react-icons/fa";

const serviceData = {
  "Home Cleaning": {
    icon: <FaBroom />,
    companies: [
      { name: "CleanPro Gujarat", description: "Expert home and office cleaning." },
      { name: "Sparkle Services", description: "Eco-friendly deep cleaning." },
      { name: "UrbanClean", description: "Affordable and reliable cleaning." }
    ]
  },
  "Plumbing": {
    icon: <FaTools />,
    companies: [
      { name: "PlumbRight", description: "24/7 plumbing solutions." },
      { name: "AquaFix", description: "Leak repair and installation." }
    ]
  },
  "Electrician": {
    icon: <FaBolt />,
    companies: [
      { name: "ElectroCare", description: "Certified electricians for all needs." },
      { name: "PowerPlus", description: "Quick and safe electrical services." }
    ]
  },
  "IT Support": {
    icon: <FaLaptop />,
    companies: [
      { name: "TechHelp Gujarat", description: "Computer and network support." },
      { name: "IT Gurus", description: "Fast IT troubleshooting." }
    ]
  },
  "Pest Control": {
    icon: <FaBug />,
    companies: [
      { name: "PestAway", description: "Safe pest management." },
      { name: "BugBusters", description: "Termite and rodent control." }
    ]
  }
};

function ServiceDetail() {
  const { serviceName } = useParams();
  const service = serviceData[serviceName];

  if (!service) return <div className="service-detail-page">Service not found.</div>;

  return (
    <div className="service-detail-page">
      <div className="service-header">
        <div className="service-icon">{service.icon}</div>
        <h2>{serviceName}</h2>
      </div>
      <h3>Available Companies</h3>
      <div className="company-cards">
        {service.companies.map((company, idx) => (
          <div key={idx} className="company-card">
            <h4>{company.name}</h4>
            <p>{company.description}</p>
          </div>
        ))}
      </div>
      <Link to="/services" className="back-btn">← Back to Services</Link>
    </div>
  );
}

export default ServiceDetail;
