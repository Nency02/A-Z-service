import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./ProviderDashboard.css";

function ProviderDashboard() {
  const { user, isLoading } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    location: "",
    image: null
  });

  // Team members for the service being added
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    age: "",
    experience: "",
    specialization: "",
    image: null
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user && user.role === "provider") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setDataLoading(true);
      
      // Fetch services
      const servicesRes = await fetch("http://localhost:5000/api/service/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // Fetch employees
      const employeesRes = await fetch("http://localhost:5000/api/employee/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services || []);
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData.employees || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Add employee to team members list
  const addEmployeeToTeam = () => {
    if (!currentEmployee.name || !currentEmployee.phone) {
      setMessage("Employee name and phone are required");
      return;
    }

    const newEmployee = {
      id: Date.now(), // Temporary ID for frontend
      ...currentEmployee
    };

    setTeamMembers([...teamMembers, newEmployee]);
    setCurrentEmployee({
      name: "",
      phone: "",
      email: "",
      address: "",
      age: "",
      experience: "",
      specialization: "",
      image: null
    });
    setMessage("Employee added to team!");
  };

  // Remove employee from team
  const removeEmployeeFromTeam = (employeeId) => {
    setTeamMembers(teamMembers.filter(emp => emp.id !== employeeId));
  };

  // Handle service form submission with team members
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    
    if (!serviceForm.title || !serviceForm.description || !serviceForm.category || !serviceForm.price || !serviceForm.location) {
      setMessage("All service fields are required");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      // First, create the service
      const serviceFormData = new FormData();
      serviceFormData.append("title", serviceForm.title);
      serviceFormData.append("description", serviceForm.description);
      serviceFormData.append("category", serviceForm.category);
      serviceFormData.append("price", serviceForm.price);
      serviceFormData.append("location", serviceForm.location);
      if (serviceForm.image) {
        serviceFormData.append("image", serviceForm.image);
      }

      const serviceRes = await fetch("http://localhost:5000/api/service/add", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: serviceFormData
      });

      if (!serviceRes.ok) {
        throw new Error("Failed to add service");
      }

      const serviceData = await serviceRes.json();
      const newServiceId = serviceData.service._id;

      // Then, add all team members to this service
      const employeePromises = teamMembers.map(async (employee) => {
        const employeeFormData = new FormData();
        employeeFormData.append("name", employee.name);
        employeeFormData.append("phone", employee.phone);
        employeeFormData.append("email", employee.email || "");
        employeeFormData.append("address", employee.address || "");
        employeeFormData.append("age", employee.age || "");
        employeeFormData.append("experience", employee.experience || "");
        employeeFormData.append("specialization", employee.specialization || "");
        employeeFormData.append("service", newServiceId);
        
        if (employee.image) {
          employeeFormData.append("image", employee.image);
        }

        return fetch("http://localhost:5000/api/employee/add", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: employeeFormData
        });
      });

      // Wait for all employees to be added
      await Promise.all(employeePromises);

      setMessage(`Service "${serviceForm.title}" added successfully with ${teamMembers.length} team members!`);
      
      // Reset forms
      setServiceForm({
        title: "",
        description: "",
        category: "",
        price: "",
        location: "",
        image: null
      });
      setTeamMembers([]);
      setCurrentEmployee({
        name: "",
        phone: "",
        email: "",
        address: "",
        age: "",
        experience: "",
        specialization: "",
        image: null
      });

      // Refresh data
      fetchData();
      
      // Go back to dashboard
      setTimeout(() => {
        setCurrentStep(0);
        setMessage("");
      }, 2000);

    } catch (err) {
      console.error("Error adding service:", err);
      setMessage("Failed to add service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId, serviceTitle) => {
    if (!confirm(`Are you sure you want to delete "${serviceTitle}"? This will also delete all associated employees.`)) {
      return;
    }

    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`http://localhost:5000/api/service/delete/${serviceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`Service "${serviceTitle}" deleted successfully. ${data.deletedEmployees} employees were also removed.`);
        fetchData(); // Refresh the data
      } else {
        const errorData = await res.json();
        setMessage(`Failed to delete service: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      setMessage("Failed to delete service. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user || user.role !== "provider") {
    return <div className="error">Access denied. Provider account required.</div>;
  }

  // Dashboard View
  if (currentStep === 0) {
    return (
      <div className="provider-dashboard">
        <div className="dashboard-header">
          <h1>Provider Dashboard</h1>
          <p>Welcome back, {user.name}!</p>
        </div>

        {message && (
          <div className={`message ${message.includes('Failed') || message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>{services.length}</h3>
            <p>Total Services</p>
          </div>
          <div className="stat-card">
            <h3>{employees.length}</h3>
            <p>Total Employees</p>
          </div>
          <div className="stat-card">
            <h3>₹0</h3>
            <p>Total Earnings</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <button 
            className="action-btn primary"
            onClick={() => setCurrentStep(1)}
          >
            + Add New Service with Team
          </button>
        </div>

        {/* Services List */}
        <div className="services-list">
          <h2>Your Services ({services.length})</h2>
          {dataLoading ? (
            <div className="loading-message">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <p>No services added yet. Click "Add New Service" to get started!</p>
            </div>
          ) : (
            <div className="services-grid">
              {services.map(service => {
                const serviceEmployees = employees.filter(emp => emp.service?._id === service._id);
                
                return (
                  <div key={service._id} className="service-card">
                    <div className="service-image">
                      {service.image ? (
                        <img 
                          src={`http://localhost:5000${service.image}`} 
                          alt={service.title}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                      {service.image && (
                        <div className="no-image" style={{ display: 'none' }}>
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="service-content">
                      <h3>{service.title}</h3>
                      <p className="service-category">{service.category}</p>
                      <p className="service-location">📍 {service.location}</p>
                      <p className="service-price">₹{service.price}</p>
                      <p className="team-count">👥 {serviceEmployees.length} team members</p>
                      <div className="service-actions">
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteService(service._id, service.title)}
                        >
                          Delete Service
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Add Service with Team Form
  if (currentStep === 1) {
    return (
      <div className="provider-dashboard">
        <div className="form-header">
          <button 
            className="back-btn"
            onClick={() => setCurrentStep(0)}
          >
            ← Back to Dashboard
          </button>
          <h1>Add New Service with Team</h1>
        </div>

        {message && (
          <div className={`message ${message.includes('Failed') || message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleServiceSubmit} className="service-form">
          {/* Service Details Section */}
          <div className="form-section">
            <h2>Service Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Service Title *</label>
                <input
                  type="text"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({...serviceForm, title: e.target.value})}
                  placeholder="e.g., House Cleaning Service"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="painting">Painting</option>
                  <option value="gardening">Gardening</option>
                  <option value="repair">Repair & Maintenance</option>
                  <option value="beauty">Beauty & Wellness</option>
                  <option value="tutoring">Tutoring</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                  placeholder="e.g., 1500"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={serviceForm.location}
                  onChange={(e) => setServiceForm({...serviceForm, location: e.target.value})}
                  placeholder="e.g., Mumbai, Delhi"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                  placeholder="Describe your service in detail..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Service Image</label>
                <input
                  type="file"
                  onChange={(e) => setServiceForm({...serviceForm, image: e.target.files[0]})}
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="form-section">
            <h2>Add Team Members</h2>
            <p className="section-description">Add employees who will provide this service</p>
            
            {/* Current Team Members */}
            {teamMembers.length > 0 && (
              <div className="team-members-list">
                <h3>Team Members ({teamMembers.length})</h3>
                <div className="team-grid">
                  {teamMembers.map(employee => (
                    <div key={employee.id} className="team-member-card">
                      <div className="member-photo">
                        {employee.image ? (
                          <img src={URL.createObjectURL(employee.image)} alt={employee.name} />
                        ) : (
                          <div className="member-placeholder">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="member-info">
                        <h4>{employee.name}</h4>
                        <p>📞 {employee.phone}</p>
                        {employee.specialization && <p>🎯 {employee.specialization}</p>}
                        <button 
                          type="button"
                          className="remove-btn"
                          onClick={() => removeEmployeeFromTeam(employee.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Employee Form */}
            <div className="add-employee-form">
              <h3>Add New Team Member</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={currentEmployee.name}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, name: e.target.value})}
                    placeholder="Employee name"
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={currentEmployee.phone}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={currentEmployee.email}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>

                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    value={currentEmployee.specialization}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, specialization: e.target.value})}
                    placeholder="e.g., Senior Cleaner"
                  />
                </div>

                <div className="form-group">
                  <label>Experience</label>
                  <input
                    type="text"
                    value={currentEmployee.experience}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, experience: e.target.value})}
                    placeholder="e.g., 3 years"
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={currentEmployee.age}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, age: e.target.value})}
                    placeholder="Age"
                    min="18"
                    max="65"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    value={currentEmployee.address}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, address: e.target.value})}
                    placeholder="Home address"
                    rows="2"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Employee Photo</label>
                  <input
                    type="file"
                    onChange={(e) => setCurrentEmployee({...currentEmployee, image: e.target.files[0]})}
                    accept="image/*"
                  />
                </div>
              </div>

              <button 
                type="button"
                className="add-employee-btn"
                onClick={addEmployeeToTeam}
              >
                Add to Team
              </button>
            </div>
          </div>

          {/* Submit Section */}
          <div className="form-actions">
            <button 
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentStep(0)}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Creating Service..." : `Create Service${teamMembers.length > 0 ? ` with ${teamMembers.length} Team Members` : ""}`}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}

export default ProviderDashboard;