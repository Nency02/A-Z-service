import React, { useState, useEffect } from "react";

function ProviderManagement({ onMessage }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    const token = localStorage.getItem("token");
    
    try {
      setLoading(true);
      
      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Users fetched for providers:", data);
      
      // Filter only providers
      const providersOnly = (data.users || []).filter(user => user.role === 'provider');
      setProviders(providersOnly);
      
    } catch (err) {
      console.error("Error fetching providers:", err);
      onMessage("Failed to load providers: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAction = async (providerId, action) => {
    const token = localStorage.getItem("token");
    
    try {
      let endpoint, body;
      
      if (action === 'approve' || action === 'reject') {
        endpoint = `/api/admin/users/${providerId}/approval`;
        body = { isApproved: action === 'approve' };
      } else {
        endpoint = `/api/admin/users/${providerId}/status`;
        body = { isActive: action === 'activate' };
      }
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Provider action completed:", data);
      
      // Update local state
      setProviders(providers.map(provider => 
        provider._id === providerId 
          ? { 
              ...provider, 
              isApproved: action === 'approve' ? true : provider.isApproved,
              isActive: action === 'activate' ? true : action === 'suspend' ? false : provider.isActive
            }
          : provider
      ));
      
      onMessage(`Provider ${action}d successfully`);
    } catch (err) {
      console.error(`Error ${action}ing provider:`, err);
      onMessage(`Failed to ${action} provider: ${err.message}`, "error");
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!window.confirm("Are you sure you want to delete this provider? This will also delete all their services and bookings. This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${providerId}`, {
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
      console.log("✅ Provider deleted:", data);
      
      // Remove from local state
      setProviders(providers.filter(provider => provider._id !== providerId));
      onMessage("Provider deleted successfully");
    } catch (err) {
      console.error("Error deleting provider:", err);
      onMessage("Failed to delete provider: " + err.message, "error");
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (provider.companyName && provider.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (provider.serviceProvided && provider.serviceProvided.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "approved" && provider.isApproved) ||
                         (filterStatus === "pending" && !provider.isApproved) ||
                         (filterStatus === "active" && provider.isActive) ||
                         (filterStatus === "inactive" && !provider.isActive);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="loading">Loading providers...</div>;
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <h2>Provider Management</h2>
        <div className="section-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Providers</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="providers-stats">
        <div className="provider-stat">
          <span className="stat-number">{providers.length}</span>
          <span className="stat-label">Total Providers</span>
        </div>
        <div className="provider-stat">
          <span className="stat-number">{providers.filter(p => p.isApproved).length}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="provider-stat">
          <span className="stat-number">{providers.filter(p => !p.isApproved).length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="provider-stat">
          <span className="stat-number">₹{providers.reduce((sum, p) => sum + (p.providerStats?.totalEarnings || 0), 0).toLocaleString()}</span>
          <span className="stat-label">Total Earnings</span>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Provider Details</th>
              <th>Contact</th>
              <th>Services</th>
              <th>Performance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.map(provider => (
              <tr key={provider._id}>
                <td>
                  <div className="provider-info">
                    <div className="provider-avatar">
                      {(provider.companyName || provider.name).split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="provider-name">{provider.companyName || provider.name}</div>
                      <div className="provider-category">{provider.serviceProvided || 'Service Provider'}</div>
                      <div className="provider-owner">Owner: {provider.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{provider.email}</div>
                  <div className="provider-phone">{provider.phone || 'N/A'}</div>
                  <div className="joined-date">Joined: {new Date(provider.createdAt).toLocaleDateString()}</div>
                  {provider.city && (
                    <div className="location">📍 {provider.city}, {provider.state || 'Gujarat'}</div>
                  )}
                </td>
                <td>
                  <div>{provider.servicesCount || 0} services</div>
                  <div className="bookings-count">{provider.providerStats?.completedBookings || 0} bookings</div>
                </td>
                <td>
                  <div>₹{(provider.providerStats?.totalEarnings || 0).toLocaleString()}</div>
                  <div className="rating">
                    {provider.providerStats?.averageRating > 0 ? (
                      <span>⭐ {provider.providerStats.averageRating.toFixed(1)}</span>
                    ) : (
                      <span>No ratings yet</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="status-badges">
                    <span className={`status ${provider.isApproved ? 'approved' : 'pending'}`}>
                      {provider.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    <span className={`status ${provider.isActive ? 'active' : 'inactive'}`}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    {!provider.isApproved && (
                      <button 
                        className="btn-approve"
                        onClick={() => handleProviderAction(provider._id, 'approve')}
                      >
                        Approve
                      </button>
                    )}
                    {provider.isActive ? (
                      <button 
                        className="btn-suspend"
                        onClick={() => handleProviderAction(provider._id, 'suspend')}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button 
                        className="btn-activate"
                        onClick={() => handleProviderAction(provider._id, 'activate')}
                      >
                        Activate
                      </button>
                    )}
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteProvider(provider._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProviders.length === 0 && (
        <div className="empty-state">
          <p>No providers found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ProviderManagement;