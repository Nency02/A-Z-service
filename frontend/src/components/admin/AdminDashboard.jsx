import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import UserManagement from "./UserManagement";
import ProviderManagement from "./ProviderManagement";
import ServiceManagement from "./ServiceManagement";
import BookingManagement from "./BookingManagement";
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
    completedBookings: 0
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

  const fetchAdminStats = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      
      const response = await fetch("http://localhost:5000/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
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
          completedBookings: 234
        });
      }

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
        completedBookings: 234
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Mock recent activity data
      setRecentActivity([
        {
          id: 1,
          type: "user",
          action: "New user registered",
          user: "John Doe",
          time: "2 hours ago",
          icon: "👤"
        },
        {
          id: 2,
          type: "provider",
          action: "Provider application submitted",
          user: "ABC Cleaning Services",
          time: "4 hours ago",
          icon: "🏢"
        },
        {
          id: 3,
          type: "booking",
          action: "New booking created",
          user: "Jane Smith",
          time: "6 hours ago",
          icon: "📋"
        },
        {
          id: 4,
          type: "service",
          action: "Service updated",
          user: "XYZ Repairs",
          time: "8 hours ago",
          icon: "🛠️"
        },
        {
          id: 5,
          type: "payment",
          action: "Payment received",
          user: "₹2,500",
          time: "1 day ago",
          icon: "💰"
        }
      ]);
    } catch (err) {
      console.error("Error fetching recent activity:", err);
    }
  };

  const showMessage = (msg, type = "success") => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(""), 5000);
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
        >
          📊 Overview
        </button>
        <button 
          className={`nav-btn ${currentView === 'users' ? 'active' : ''}`}
          onClick={() => setCurrentView('users')}
        >
          👥 Users ({stats.totalUsers})
        </button>
        <button 
          className={`nav-btn ${currentView === 'providers' ? 'active' : ''}`}
          onClick={() => setCurrentView('providers')}
        >
          🏢 Providers ({stats.totalProviders})
        </button>
        <button 
          className={`nav-btn ${currentView === 'services' ? 'active' : ''}`}
          onClick={() => setCurrentView('services')}
        >
          🛠️ Services ({stats.totalServices})
        </button>
        <button 
          className={`nav-btn ${currentView === 'bookings' ? 'active' : ''}`}
          onClick={() => setCurrentView('bookings')}
        >
          📋 Bookings ({stats.totalBookings})
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
          </div>

          {/* Recent Activity */}
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <span className="activity-icon">{activity.icon}</span>
                  <div className="activity-content">
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-user">{activity.user}</span>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </div>
              ))}
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
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      {currentView === 'users' && (
        <UserManagement onMessage={showMessage} />
      )}

      {/* Provider Management */}
      {currentView === 'providers' && (
        <ProviderManagement onMessage={showMessage} onStatsUpdate={fetchAdminStats} />
      )}

      {/* Service Management */}
      {currentView === 'services' && (
        <ServiceManagement onMessage={showMessage} />
      )}

      {/* Booking Management */}
      {currentView === 'bookings' && (
        <BookingManagement onMessage={showMessage} />
      )}

      {loading && <div className="loading-overlay">Loading...</div>}
    </div>
  );
}

export default AdminDashboard;