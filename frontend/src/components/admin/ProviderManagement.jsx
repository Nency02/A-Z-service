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
      
      // Mock data - replace with actual API call
      const mockUsers = [
        {
          _id: "1",
          name: "John Doe",
          email: "john@example.com",
          phone: "9876543210",
          createdAt: new Date(2024, 0, 15),
          isActive: true,
          lastLogin: new Date(2024, 9, 29),
          bookingsCount: 5,
          totalSpent: 7500
        },
        {
          _id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "8765432109",
          createdAt: new Date(2024, 1, 22),
          isActive: true,
          lastLogin: new Date(2024, 9, 30),
          bookingsCount: 3,
          totalSpent: 4200
        },
        {
          _id: "3",
          name: "Mike Johnson",
          email: "mike@example.com",
          phone: "7654321098",
          createdAt: new Date(2024, 2, 10),
          isActive: false,
          lastLogin: new Date(2024, 8, 15),
          bookingsCount: 1,
          totalSpent: 1500
        },
        {
          _id: "4",
          name: "Sarah Wilson",
          email: "sarah@example.com",
          phone: "6543210987",
          createdAt: new Date(2024, 3, 5),
          isActive: true,
          lastLogin: new Date(2024, 9, 28),
          bookingsCount: 8,
          totalSpent: 12000
        },
        {
          _id: "5",
          name: "David Brown",
          email: "david@example.com",
          phone: "5432109876",
          createdAt: new Date(2024, 4, 18),
          isActive: true,
          lastLogin: new Date(2024, 9, 31),
          bookingsCount: 2,
          totalSpent: 3000
        }
      ];
      
      setUsers(mockUsers);
      
    } catch (err) {
      console.error("Error fetching users:", err);
      onMessage("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    const token = localStorage.getItem("token");
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isActive: action === 'activate' }
          : user
      ));
      
      onMessage(`User ${action}d successfully`);
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      onMessage(`Failed to ${action} user`, "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.filter(user => user._id !== userId));
      onMessage("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      onMessage("Failed to delete user", "error");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && user.isActive) ||
                         (filterStatus === "inactive" && !user.isActive);
    
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
          <span className="stat-number">{users.filter(u => u.isActive).length}</span>
          <span className="stat-label">Active Users</span>
        </div>
        <div className="user-stat">
          <span className="stat-number">{users.filter(u => !u.isActive).length}</span>
          <span className="stat-label">Inactive Users</span>
        </div>
        <div className="user-stat">
          <span className="stat-number">₹{users.reduce((sum, u) => sum + u.totalSpent, 0).toLocaleString()}</span>
          <span className="stat-label">Total Revenue</span>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Details</th>
              <th>Contact</th>
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
                    </div>
                  </div>
                </td>
                <td>
                  <div>{user.email}</div>
                  <div className="user-phone">{user.phone}</div>
                </td>
                <td>
                  <div>Joined: {user.createdAt.toLocaleDateString()}</div>
                  <div className="last-login">
                    Last: {user.lastLogin.toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <div>{user.bookingsCount} bookings</div>
                  <div className="total-spent">₹{user.totalSpent.toLocaleString()}</div>
                </td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
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