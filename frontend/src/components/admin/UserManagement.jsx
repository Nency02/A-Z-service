import React, { useState, useEffect } from "react";

function UserManagement({ onMessage }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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
      console.log("📊 Users fetched:", data);
      
      setUsers(data.users || []);
      
    } catch (err) {
      console.error("Error fetching users:", err);
      onMessage("Failed to load users: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    const token = localStorage.getItem("token");
    
    try {
      const isActive = action === 'activate';
      
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ User status updated:", data);
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isActive: isActive }
          : user
      ));
      
      onMessage(`User ${action}d successfully`);
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      onMessage(`Failed to ${action} user: ${err.message}`, "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
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
      console.log("✅ User deleted:", data);
      
      // Remove from local state
      setUsers(users.filter(user => user._id !== userId));
      onMessage("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      onMessage("Failed to delete user: " + err.message, "error");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm)) ||
                         (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && user.isActive) ||
                         (filterStatus === "inactive" && !user.isActive) ||
                         (filterStatus === "customers" && user.role === "customer") ||
                         (filterStatus === "providers" && user.role === "provider");
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <h2>User Management</h2>
        <div className="section-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="customers">Customers Only</option>
              <option value="providers">Providers Only</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="users-stats">
        <div className="user-stat">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="user-stat">
          <span className="stat-number">{users.filter(u => u.role === 'customer').length}</span>
          <span className="stat-label">Customers</span>
        </div>
        <div className="user-stat">
          <span className="stat-number">{users.filter(u => u.role === 'provider').length}</span>
          <span className="stat-label">Providers</span>
        </div>
        <div className="user-stat">
          <span className="stat-number">{users.filter(u => u.isActive).length}</span>
          <span className="stat-label">Active Users</span>
        </div>
        <div className="user-stat">
          <span className="stat-number">₹{users.reduce((sum, u) => sum + (u.totalSpent || 0), 0).toLocaleString()}</span>
          <span className="stat-label">Total Revenue</span>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Details</th>
              <th>Contact & Role</th>
              <th>Activity</th>
              <th>Stats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-id">ID: {user._id}</div>
                      {user.companyName && (
                        <div className="company-name">🏢 {user.companyName}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div>{user.email}</div>
                  <div className="user-phone">{user.phone || 'N/A'}</div>
                  <div className="user-role">
                    <span className={`role-badge ${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                    {user.role === 'provider' && (
                      <div className="service-type">{user.serviceProvided}</div>
                    )}
                  </div>
                </td>
                <td>
                  <div>Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                  {user.lastBooking && (
                    <div className="last-activity">
                      Last Activity: {new Date(user.lastBooking).toLocaleDateString()}
                    </div>
                  )}
                  {user.city && (
                    <div className="location">📍 {user.city}, {user.state || 'Gujarat'}</div>
                  )}
                </td>
                <td>
                  {user.role === 'customer' ? (
                    <div>
                      <div>{user.bookingsCount || 0} bookings</div>
                      <div className="total-spent">₹{(user.totalSpent || 0).toLocaleString()}</div>
                    </div>
                  ) : user.role === 'provider' ? (
                    <div>
                      <div>₹{(user.providerStats?.totalEarnings || 0).toLocaleString()} earned</div>
                      <div className="provider-stats">
                        {user.providerStats?.completedBookings || 0} bookings
                        {user.providerStats?.averageRating > 0 && (
                          <span> | ⭐ {user.providerStats.averageRating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>-</div>
                  )}
                </td>
                <td>
                  <div className="status-badges">
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.role === 'provider' && (
                      <span className={`status ${user.isApproved ? 'approved' : 'pending'}`}>
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    {user.isActive ? (
                      <button 
                        className="btn-suspend"
                        onClick={() => handleUserAction(user._id, 'suspend')}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button 
                        className="btn-activate"
                        onClick={() => handleUserAction(user._id, 'activate')}
                      >
                        Activate
                      </button>
                    )}
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user._id)}
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

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <p>No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default UserManagement;