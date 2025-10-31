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
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockServices = [
        {
          _id: "1",
          title: "Professional House Cleaning",
          category: "Cleaning",
          price: 1500,
          location: "Mumbai",
          description: "Complete house cleaning with professional equipment",
          image: null,
          provider: {
            _id: "p1",
            name: "ABC Cleaning Services",
            email: "abc@cleaning.com"
          },
          teamMembers: [
            { name: "John Doe", role: "Cleaner", experience: "2 years" },
            { name: "Jane Smith", role: "Supervisor", experience: "5 years" }
          ],
          isActive: true,
          createdAt: new Date(2024, 0, 15),
          bookingsCount: 25,
          rating: 4.8,
          reviews: 18
        },
        {
          _id: "2",
          title: "AC Repair & Maintenance",
          category: "Repair",
          price: 800,
          location: "Delhi",
          description: "Expert AC repair and maintenance services",
          image: null,
          provider: {
            _id: "p2",
            name: "XYZ Repair Solutions",
            email: "xyz@repairs.com"
          },
          teamMembers: [
            { name: "Mike Johnson", role: "Technician", experience: "4 years" }
          ],
          isActive: true,
          createdAt: new Date(2024, 1, 22),
          bookingsCount: 12,
          rating: 4.5,
          reviews: 8
        },
        {
          _id: "3",
          title: "Plumbing Services",
          category: "Repair",
          price: 600,
          location: "Bangalore",
          description: "Complete plumbing solutions for homes and offices",
          image: null,
          provider: {
            _id: "p3",
            name: "Home Care Experts",
            email: "homecare@experts.com"
          },
          teamMembers: [
            { name: "David Wilson", role: "Plumber", experience: "6 years" },
            { name: "Sarah Brown", role: "Assistant", experience: "1 year" }
          ],
          isActive: true,
          createdAt: new Date(2024, 2, 10),
          bookingsCount: 30,
          rating: 4.7,
          reviews: 22
        },
        {
          _id: "4",
          title: "Carpet Cleaning",
          category: "Cleaning",
          price: 1200,
          location: "Chennai",
          description: "Deep carpet cleaning with eco-friendly products",
          image: null,
          provider: {
            _id: "p1",
            name: "ABC Cleaning Services",
            email: "abc@cleaning.com"
          },
          teamMembers: [
            { name: "Emma Davis", role: "Specialist", experience: "3 years" }
          ],
          isActive: false,
          createdAt: new Date(2024, 3, 5),
          bookingsCount: 8,
          rating: 4.3,
          reviews: 5
        }
      ];
      
      setServices(mockServices);
      
    } catch (err) {
      console.error("Error fetching services:", err);
      onMessage("Failed to load services", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setServices(services.filter(service => service._id !== serviceId));
      onMessage("Service deleted successfully");
    } catch (err) {
      console.error("Error deleting service:", err);
      onMessage("Failed to delete service", "error");
    }
  };

  const handleToggleStatus = async (serviceId) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setServices(services.map(service => 
        service._id === serviceId 
          ? { ...service, isActive: !service.isActive }
          : service
      ));
      
      const service = services.find(s => s._id === serviceId);
      onMessage(`Service ${service.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error("Error toggling service status:", err);
      onMessage("Failed to update service status", "error");
    }
  };

  const categories = ["all", ...new Set(services.map(service => service.category))];
  
  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.location.toLowerCase().includes(searchTerm.toLowerCase());
    
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
                  alt={service.title}
                />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            
            <div className="service-info">
              <h3>{service.title}</h3>
              <p className="provider-name">By: {service.provider.name}</p>
              
              <div className="service-details">
                <span className="service-category">{service.category}</span>
                <span className="service-price">₹{service.price}</span>
                <span className="service-location">📍 {service.location}</span>
              </div>
              
              <p className="service-description">{service.description}</p>
              
              <div className="service-metrics">
                <div className="metric">
                  <span className="metric-value">★ {service.rating}</span>
                  <span className="metric-label">Rating ({service.reviews})</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{service.bookingsCount}</span>
                  <span className="metric-label">Bookings</span>
                </div>
              </div>
              
              <div className="team-info">
                <h4>Team Members:</h4>
                <div className="team-list">
                  {service.teamMembers.map((member, index) => (
                    <div key={index} className="team-member">
                      <span className="member-name">{member.name}</span>
                      <span className="member-role">({member.role})</span>
                    </div>
                  ))}
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