import React, { useState, useEffect } from "react";

function ServiceManagement({ onMessage }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const token = localStorage.getItem("token");
    
    try {
      setLoading(true);
      
      const response = await fetch("http://localhost:5000/api/admin/services", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Services fetched:", data);
      
      setServices(data.services || []);
      
    } catch (err) {
      console.error("Error fetching services:", err);
      onMessage("Failed to load services: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service? This will also delete all associated bookings. This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Service deleted:", data);
      
      // Remove from local state
      setServices(services.filter(service => service._id !== serviceId));
      onMessage("Service deleted successfully");
    } catch (err) {
      console.error("Error deleting service:", err);
      onMessage("Failed to delete service: " + err.message, "error");
    }
  };

  const handleToggleStatus = async (serviceId) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/services/${serviceId}/status`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Service status updated:", data);
      
      setServices(services.map(service => 
        service._id === serviceId 
          ? { ...service, isActive: data.service.isActive }
          : service
      ));
      
      onMessage(`Service ${data.service.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error("Error toggling service status:", err);
      onMessage("Failed to update service status: " + err.message, "error");
    }
  };

  const categories = ["all", ...new Set(services.map(service => service.category || 'Uncategorized'))];
  
  const filteredServices = services.filter(service => {
    const matchesSearch = (service.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.provider?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || service.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="loading">Loading services...</div>;
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <h2>Service Management</h2>
        <div className="section-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="services-stats">
        <div className="service-stat">
          <span className="stat-number">{services.length}</span>
          <span className="stat-label">Total Services</span>
        </div>
        <div className="service-stat">
          <span className="stat-number">{services.filter(s => s.isActive).length}</span>
          <span className="stat-label">Active Services</span>
        </div>
        <div className="service-stat">
          <span className="stat-number">{services.filter(s => !s.isActive).length}</span>
          <span className="stat-label">Inactive Services</span>
        </div>
        <div className="service-stat">
          <span className="stat-number">{services.reduce((sum, s) => sum + s.bookingsCount, 0)}</span>
          <span className="stat-label">Total Bookings</span>
        </div>
      </div>

      <div className="services-grid">
        {filteredServices.map(service => (
          <div key={service._id} className="service-admin-card">
            <div className="service-status-indicator">
              <span className={`status-dot ${service.isActive ? 'active' : 'inactive'}`}></span>
            </div>
            
            <div className="service-image">
              {service.image ? (
                <img 
                  src={`http://localhost:5000${service.image}`} 
                  alt={service.title || 'Service image'}
                />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            
            <div className="service-info">
              <h3>{service.title || 'Untitled Service'}</h3>
              <p className="provider-name">By: {service.provider?.name || 'Unknown Provider'}</p>
              
              <div className="service-details">
                <span className="service-category">{service.category || 'Uncategorized'}</span>
                <span className="service-price">₹{service.price || 0}</span>
                <span className="service-location">📍 {service.location || 'Location not specified'}</span>
              </div>
              
              <p className="service-description">{service.description || 'No description available'}</p>
              
              <div className="service-metrics">
                <div className="metric">
                  <span className="metric-value">★ {service.rating || 0}</span>
                  <span className="metric-label">Rating ({service.reviews || 0})</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{service.bookingsCount || 0}</span>
                  <span className="metric-label">Bookings</span>
                </div>
              </div>
              
              <div className="team-info">
                <h4>Team Members:</h4>
                <div className="team-list">
                  {(service.teamMembers || []).map((member, index) => (
                    <div key={index} className="team-member">
                      <span className="member-name">{member.name}</span>
                      <span className="member-role">({member.role})</span>
                    </div>
                  ))}
                  {(!service.teamMembers || service.teamMembers.length === 0) && (
                    <p className="no-team">No team members assigned</p>
                  )}
                </div>
              </div>
              
              <div className="service-actions">
                <button 
                  className={`btn-toggle ${service.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                  onClick={() => handleToggleStatus(service._id)}
                >
                  {service.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteService(service._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="empty-state">
          <p>No services found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ServiceManagement;