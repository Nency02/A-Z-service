import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaBroom, FaTools, FaBolt, FaLaptop, FaBug, FaCar, FaPaintBrush, FaCamera, FaHome, FaWrench, FaMapMarkerAlt, FaPhone, FaEnvelope, FaStar } from "react-icons/fa";

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

function ServiceDetail() {
  const { serviceName } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServicesByCategory();
  }, [serviceName]);

  const fetchServicesByCategory = async () => {
    try {
      setLoading(true);
      // Map URL-friendly names back to database categories
      const categoryMap = {
        'Home Cleaning': 'cleaning',
        'Plumbing': 'plumbing',
        'Electrician': 'electrician',
        'IT Support': 'it support',
        'Pest Control': 'pest control'
      };
      
      const category = categoryMap[serviceName] || serviceName.toLowerCase();
      const response = await fetch(`http://localhost:5000/api/service/category/${category}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      console.log('ServiceDetail API response:', data);
      
      // The API returns { services: [...] }, so we need to access data.services
      const servicesList = data.services || [];
      setServices(servicesList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleBackToServices = () => {
    // Navigate to home page and scroll to services section
    window.location.href = "/#services";
  };

  if (loading) {
    return (
      <div className="service-detail-page">
        <div className="service-header">
          <h2>{serviceName}</h2>
        </div>
        <p>Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-detail-page">
        <div className="service-header">
          <h2>{serviceName}</h2>
        </div>
        <p>Error loading services: {error}</p>
        <button onClick={handleBackToServices} className="back-btn">← Back to Services</button>
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      <div className="service-header">
        <div className="service-icon">{getServiceIcon(services[0]?.category)}</div>
        <h2>{serviceName}</h2>
      </div>
      <h3>Available Service Providers ({services.length})</h3>
      {services.length === 0 ? (
        <div className="no-services">
          <p>No service providers found for {serviceName}.</p>
          <p>Be the first to register as a service provider!</p>
        </div>
      ) : (
        <div className="company-cards">
          {services.map((service) => (
            <div key={service._id} className="company-card">
              <div className="company-header">
                {service.image && (
                  <img 
                    src={`http://localhost:5000${service.image}`} 
                    alt={service.title}
                    className="service-image"
                    onError={(e) => {e.target.style.display = 'none'}}
                  />
                )}
                <div>
                  <h4>{service.title}</h4>
                  <p className="provider-name">
                    <FaMapMarkerAlt /> {service.provider?.name || 'Service Provider'}
                  </p>
                </div>
              </div>
              <p className="service-description">{service.description}</p>
              <div className="service-details">
                <div className="price">₹{service.price}</div>
                {service.provider?.phone && (
                  <div className="contact-info">
                    <FaPhone /> {service.provider.phone}
                  </div>
                )}
                {service.provider?.email && (
                  <div className="contact-info">
                    <FaEnvelope /> {service.provider.email}
                  </div>
                )}
              </div>
              {service.location && (
                <p className="location">
                  <FaMapMarkerAlt /> {service.location}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <button onClick={handleBackToServices} className="back-btn">← Back to Services</button>
    </div>
  );
}

export default ServiceDetail;
