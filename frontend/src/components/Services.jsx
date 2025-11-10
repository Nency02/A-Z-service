import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBroom, FaTools, FaBolt, FaLaptop, FaBug, FaCar, FaPaintBrush, FaCamera, FaHome, FaWrench } from "react-icons/fa";

// Icon mapping for different service categories
const getServiceIcon = (category) => {
  const iconMap = {
    'cleaning': <FaBroom />,
    'plumbing': <FaTools />,
    'electrician': <FaBolt />,
    'it support': <FaLaptop />,
    'pest control': <FaBug />,
    'automotive': <FaCar />,
    'painting': <FaPaintBrush />,
    'photography': <FaCamera />,
    'home services': <FaHome />,
    'repair': <FaWrench />
  };
  return iconMap[category?.toLowerCase()] || <FaTools />;
};

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/service/');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch services`);
      }
      const data = await response.json();
      console.log('Services API response:', data);
      
      // The API returns { services: [...] }, so we need to access data.services
      const servicesList = data.services || [];
      
      console.log('Services list:', servicesList, 'Type:', typeof servicesList, 'Is Array:', Array.isArray(servicesList));
      
      if (!Array.isArray(servicesList)) {
        throw new Error('Services data is not an array');
      }
      
      if (servicesList.length === 0) {
        console.log('No services found in database');
        setServices([]);
        setLoading(false);
        return;
      }
      
      // Group services by category to show unique service types
      const uniqueCategories = {};
      servicesList.forEach(service => {
        if (service && service.category) {
          const category = service.category.toLowerCase();
          if (!uniqueCategories[category]) {
            uniqueCategories[category] = {
              name: service.category.charAt(0).toUpperCase() + service.category.slice(1),
              description: `Professional ${service.category} services available in your area`,
              category: service.category,
              count: 1
            };
          } else {
            uniqueCategories[category].count++;
          }
        } else {
          console.warn('Service missing category:', service);
        }
      });

      const categoryList = Object.values(uniqueCategories);
      console.log('Processed categories:', categoryList);
      setServices(categoryList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message);
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <section id="services" className="services-section">
        <h2>Our Services</h2>
        <div className="services-grid">
          <p>Loading services...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="services" className="services-section">
        <h2>Our Services</h2>
        <div className="services-grid">
          <p>Error loading services: {error}</p>
        </div>
      </section>
    );
  }

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
            <div className="service-icon">{getServiceIcon(service.category)}</div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            {service.count > 1 && (
              <small style={{ color: '#666', fontStyle: 'italic' }}>
                {service.count} providers available
              </small>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Services;