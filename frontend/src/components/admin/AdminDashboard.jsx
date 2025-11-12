import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import UserManagement from "./UserManagement";
import ProviderManagement from "./ProviderManagement";
import ServiceManagement from "./ServiceManagement";
import BookingManagement from "./BookingManagement";
import ContactManagement from "./ContactManagement";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalServices: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    completedBookings: 0,
    totalContacts: 0,
    newContacts: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAdminStats();
      fetchRecentActivity();
    }
  }, [user]);

  useEffect(() => {
    // Update document title based on current view
    const titles = {
      overview: "Admin Dashboard - Overview",
      users: "Admin Dashboard - User Management", 
      providers: "Admin Dashboard - Provider Management",
      services: "Admin Dashboard - Service Management",
      bookings: "Admin Dashboard - Booking Management",
      contacts: "Admin Dashboard - Contact Messages"
    };
    document.title = titles[currentView] || "Admin Dashboard";
  }, [currentView]);

  const fetchAdminStats = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      
      const response = await fetch("http://localhost:5000/api/admin/dashboard-stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.users?.total || 0,
          totalProviders: data.users?.providers || 0,
          totalServices: data.services?.total || 0,
          totalBookings: data.bookings?.total || 0,
          totalRevenue: data.bookings?.revenue || 0,
          pendingApprovals: data.users?.pendingProviders || 0,
          activeUsers: data.users?.active || 0,
          completedBookings: data.bookings?.completed || 0,
          totalContacts: 0,
          newContacts: 0
        });
      } else {
        // Mock data for demo
        setStats({
          totalUsers: 156,
          totalProviders: 45,
          totalServices: 132,
          totalBookings: 287,
          totalRevenue: 145670,
          pendingApprovals: 8,
          activeUsers: 142,
          completedBookings: 234,
          totalContacts: 0,
          newContacts: 0
        });
      }

      // Fetch contact stats separately
      await fetchContactStats();

    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setMessage("Failed to load admin statistics");
      // Set mock data on error
      setStats({
        totalUsers: 156,
        totalProviders: 45,
        totalServices: 132,
        totalBookings: 287,
        totalRevenue: 145670,
        pendingApprovals: 8,
        activeUsers: 142,
        completedBookings: 234,
        totalContacts: 0,
        newContacts: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContactStats = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found for fetching contact stats");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:5000/api/contact/messages", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prevStats => ({
          ...prevStats,
          totalContacts: data.counts?.total || 0,
          newContacts: data.counts?.new || 0
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("Failed to fetch contact stats:", response.status, response.statusText, errorData);
        
        if (response.status === 401) {
          console.warn("Authentication failed for contact stats - admin may need to log in again");
        } else if (response.status === 403) {
          console.warn("Access denied for contact stats - insufficient privileges");
        }
      }
    } catch (err) {
      console.error("Error fetching contact stats:", err);
    }
  };

  const fetchRecentActivity = async () => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch("http://localhost:5000/api/admin/recent-activity", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("� Recent activity fetched:", data);
        
        // Format the activities with relative time
        const formattedActivities = data.activities.map(activity => ({
          ...activity,
          timeAgo: getTimeAgo(new Date(activity.time))
        }));
        
        setRecentActivity(formattedActivities);
      } else {
        console.warn("Failed to fetch recent activity, using fallback");
        // Fallback to empty array instead of mock data
        setRecentActivity([]);
      }
    } catch (err) {
      console.error("Error fetching recent activity:", err);
      // Set empty array on error instead of mock data
      setRecentActivity([]);
    }
  };

  // Helper function to get relative time
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 60) {
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    } else {
      return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
    }
  };

  const showMessage = (msg, type = "success") => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(""), 5000);
  };

  // Add keyboard navigation
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  if (isLoading) {
    return <div className="loading">Loading Admin Dashboard...</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your A-Z Service platform efficiently</p>
      </div>

      {message && (
        <div className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text || message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-nav">
        <button 
          className={`nav-btn ${currentView === 'overview' ? 'active' : ''}`}
          onClick={() => setCurrentView('overview')}
          title="Dashboard Overview"
        >
          📊 Overview
        </button>
        <button 
          className={`nav-btn ${currentView === 'users' ? 'active' : ''}`}
          onClick={() => setCurrentView('users')}
          title="Manage Users"
        >
          👥 Users <span className="nav-count">({stats.totalUsers})</span>
        </button>
        <button 
          className={`nav-btn ${currentView === 'providers' ? 'active' : ''}`}
          onClick={() => setCurrentView('providers')}
          title="Manage Providers"
        >
          🏢 Providers <span className="nav-count">({stats.totalProviders})</span>
          {stats.pendingApprovals > 0 && (
            <span className="pending-indicator">{stats.pendingApprovals}</span>
          )}
        </button>
        <button 
          className={`nav-btn ${currentView === 'services' ? 'active' : ''}`}
          onClick={() => setCurrentView('services')}
          title="Manage Services"
        >
          🛠️ Services <span className="nav-count">({stats.totalServices})</span>
        </button>
        <button 
          className={`nav-btn ${currentView === 'bookings' ? 'active' : ''}`}
          onClick={() => setCurrentView('bookings')}
          title="Manage Bookings"
        >
          📋 Bookings <span className="nav-count">({stats.totalBookings})</span>
        </button>
        <button 
          className={`nav-btn ${currentView === 'contacts' ? 'active' : ''}`}
          onClick={() => setCurrentView('contacts')}
          title="Contact Messages"
        >
          📧 Messages <span className="nav-count">({stats.totalContacts})</span>
          {stats.newContacts > 0 && (
            <span className="pending-indicator">{stats.newContacts}</span>
          )}
        </button>
      </div>

      {/* Overview Section */}
      {currentView === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card users">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalUsers}</h3>
                <p>Total Users</p>
                <span className="stat-detail">{stats.activeUsers} Active</span>
              </div>
            </div>
            
            <div className="stat-card providers">
              <div className="stat-icon">🏢</div>
              <div className="stat-info">
                <h3>{stats.totalProviders}</h3>
                <p>Total Providers</p>
                <span className="stat-detail">{stats.pendingApprovals} Pending</span>
              </div>
            </div>
            
            <div className="stat-card services">
              <div className="stat-icon">🛠️</div>
              <div className="stat-info">
                <h3>{stats.totalServices}</h3>
                <p>Total Services</p>
                <span className="stat-detail">Active Services</span>
              </div>
            </div>
            
            <div className="stat-card bookings">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats.totalBookings}</h3>
                <p>Total Bookings</p>
                <span className="stat-detail">{stats.completedBookings} Completed</span>
              </div>
            </div>
            
            <div className="stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
                <p>Total Revenue</p>
                <span className="stat-detail">This Month</span>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.pendingApprovals}</h3>
                <p>Pending Approvals</p>
                <span className="stat-detail">Requires Action</span>
              </div>
            </div>
            
            <div className="stat-card messages">
              <div className="stat-icon">📧</div>
              <div className="stat-info">
                <h3>{stats.totalContacts}</h3>
                <p>Contact Messages</p>
                <span className="stat-detail">{stats.newContacts} New</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <span className="activity-icon">{activity.icon}</span>
                    <div className="activity-content">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-user">{activity.user}</span>
                      {activity.details && (
                        <span className="activity-details">{activity.details}</span>
                      )}
                    </div>
                    <span className="activity-time">{activity.timeAgo || activity.time}</span>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  <span className="no-activity-icon">📊</span>
                  <div className="no-activity-content">
                    <span className="no-activity-text">No recent activity yet</span>
                    <span className="no-activity-subtext">User activities will appear here once your platform becomes active</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-grid">
              <button 
                className="action-card"
                onClick={() => setCurrentView('providers')}
              >
                <div className="action-icon">✅</div>
                <div className="action-info">
                  <h3>Approve Providers</h3>
                  <p>{stats.pendingApprovals} pending approvals</p>
                </div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => setCurrentView('users')}
              >
                <div className="action-icon">👥</div>
                <div className="action-info">
                  <h3>Manage Users</h3>
                  <p>View all registered users</p>
                </div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => setCurrentView('services')}
              >
                <div className="action-icon">🛠️</div>
                <div className="action-info">
                  <h3>Monitor Services</h3>
                  <p>Review service listings</p>
                </div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => setCurrentView('bookings')}
              >
                <div className="action-icon">📋</div>
                <div className="action-info">
                  <h3>Track Bookings</h3>
                  <p>Monitor all transactions</p>
                </div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => setCurrentView('contacts')}
              >
                <div className="action-icon">📧</div>
                <div className="action-info">
                  <h3>Contact Messages</h3>
                  <p>{stats.newContacts > 0 ? `${stats.newContacts} new messages` : 'View all messages'}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      {currentView === 'users' && (
        <div className="management-section">
          <div className="section-header-card">
            <button 
              className="back-btn"
              onClick={() => setCurrentView('overview')}
              title="Back to Overview"
            >
              ← Back to Overview
            </button>
            <div className="section-icon">👥</div>
            <div className="section-title-info">
              <h2>User Management</h2>
              <p>Manage all registered users on the platform</p>
            </div>
            <div className="section-stats">
              <span className="stat-badge">{stats.totalUsers} Total Users</span>
              <span className="stat-badge active">{stats.activeUsers} Active</span>
            </div>
          </div>
          <UserManagement onMessage={showMessage} />
        </div>
      )}

      {/* Provider Management */}
      {currentView === 'providers' && (
        <div className="management-section">
          <div className="section-header-card">
            <button 
              className="back-btn"
              onClick={() => setCurrentView('overview')}
              title="Back to Overview"
            >
              ← Back to Overview
            </button>
            <div className="section-icon">🏢</div>
            <div className="section-title-info">
              <h2>Provider Management</h2>
              <p>Manage service providers and their approvals</p>
            </div>
            <div className="section-stats">
              <span className="stat-badge">{stats.totalProviders} Total Providers</span>
              {stats.pendingApprovals > 0 && (
                <span className="stat-badge pending">{stats.pendingApprovals} Pending</span>
              )}
            </div>
          </div>
          <ProviderManagement onMessage={showMessage} onStatsUpdate={fetchAdminStats} />
        </div>
      )}

      {/* Service Management */}
      {currentView === 'services' && (
        <div className="management-section">
          <div className="section-header-card">
            <button 
              className="back-btn"
              onClick={() => setCurrentView('overview')}
              title="Back to Overview"
            >
              ← Back to Overview
            </button>
            <div className="section-icon">🛠️</div>
            <div className="section-title-info">
              <h2>Service Management</h2>
              <p>Monitor and manage all service listings</p>
            </div>
            <div className="section-stats">
              <span className="stat-badge">{stats.totalServices} Total Services</span>
              <span className="stat-badge active">Active Services</span>
            </div>
          </div>
          <ServiceManagement onMessage={showMessage} />
        </div>
      )}

      {/* Booking Management */}
      {currentView === 'bookings' && (
        <div className="management-section">
          <div className="section-header-card">
            <button 
              className="back-btn"
              onClick={() => setCurrentView('overview')}
              title="Back to Overview"
            >
              ← Back to Overview
            </button>
            <div className="section-icon">📋</div>
            <div className="section-title-info">
              <h2>Booking Management</h2>
              <p>Track and manage all booking transactions</p>
            </div>
            <div className="section-stats">
              <span className="stat-badge">{stats.totalBookings} Total Bookings</span>
              <span className="stat-badge completed">{stats.completedBookings} Completed</span>
              <span className="stat-badge revenue">₹{stats.totalRevenue.toLocaleString()} Revenue</span>
            </div>
          </div>
          <BookingManagement onMessage={showMessage} />
        </div>
      )}

      {/* Contact Management */}
      {currentView === 'contacts' && (
        <div className="management-section">
          <div className="section-header-card">
            <button 
              className="back-btn"
              onClick={() => setCurrentView('overview')}
              title="Back to Overview"
            >
              ← Back to Overview
            </button>
            <div className="section-icon">📧</div>
            <div className="section-title-info">
              <h2>Contact Messages</h2>
              <p>Manage customer inquiries and messages</p>
            </div>
            <div className="section-stats">
              <span className="stat-badge">{stats.totalContacts} Total Messages</span>
              {stats.newContacts > 0 && (
                <span className="stat-badge pending">{stats.newContacts} New</span>
              )}
            </div>
          </div>
          <ContactManagement onMessage={showMessage} />
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <span>Loading admin data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;