import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, FaHistory, FaCalendarAlt, FaStar, FaEdit, FaPhone, FaEnvelope, 
  FaMapMarkerAlt, FaClock, FaCheckCircle, FaSpinner, FaTimes 
} from 'react-icons/fa';
import './Profile.css';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const [serviceHistory, setServiceHistory] = useState([]);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    // Fetch all bookings once
    fetch(`http://localhost:5000/api/booking/my`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        const bookings = data.bookings || [];
        setServiceHistory(bookings.filter(b => b.status === 'completed'));
        setCurrentBookings(bookings.filter(b => b.status === 'pending' || b.status === 'confirmed'));
        setUpcomingServices(bookings.filter(b => b.status === 'scheduled'));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching bookings:", err);
        setLoading(false);
      });
  }, [user, navigate]);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    fetch(`http://localhost:5000/api/auth/profile/${user._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(editForm)
    })
      .then(res => res.json())
      .then(data => {
        setIsEditing(false);
        // Optionally update user context here
      })
      .catch(err => console.error("Error updating profile:", err));
  };

  const handleCancelBooking = (bookingId) => {
    fetch(`http://localhost:5000/api/booking/cancel/${bookingId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setCurrentBookings(prev => prev.filter(booking => booking._id !== bookingId));
      })
      .catch(err => console.error("Error cancelling booking:", err));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle style={{ color: '#10b981' }} />;
      case 'confirmed': return <FaCheckCircle style={{ color: '#3b82f6' }} />;
      case 'pending': return <FaSpinner style={{ color: '#f59e0b' }} />;
      case 'scheduled': return <FaCalendarAlt style={{ color: '#8b5cf6' }} />;
      default: return <FaTimes style={{ color: '#ef4444' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'confirmed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'scheduled': return '#8b5cf6';
      default: return '#ef4444';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#ffd700' : '#ddd' }}>★</span>
      );
    }
    return stars;
  };

  if (!user || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar"><FaUser /></div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{serviceHistory.length}</span>
              <span className="stat-label">Services Completed</span>
            </div>
            <div className="stat">
              <span className="stat-number">{currentBookings.length}</span>
              <span className="stat-label">Active Bookings</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {serviceHistory.length > 0 
                  ? (serviceHistory.reduce((acc, b) => acc + (b.rating || 0), 0) / serviceHistory.length).toFixed(1)
                  : '0.0'}
              </span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
        <button className="edit-profile-btn" onClick={() => setIsEditing(!isEditing)}>
          <FaEdit /> {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Service History</button>
        <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Current Bookings</button>
        <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming Services</button>
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="edit-form">
                <h3>Edit Profile Information</h3>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} rows={3} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <h3>Profile Information</h3>
                <div className="info-grid">
                  <div className="info-item"><FaUser className="info-icon" /><div><label>Full Name</label><p>{user.name}</p></div></div>
                  <div className="info-item"><FaEnvelope className="info-icon" /><div><label>Email</label><p>{user.email}</p></div></div>
                  <div className="info-item"><FaPhone className="info-icon" /><div><label>Phone</label><p>{user.phone || 'Not provided'}</p></div></div>
                  <div className="info-item"><FaMapMarkerAlt className="info-icon" /><div><label>Address</label><p>{user.address || 'Not provided'}</p></div></div>
                </div>
              </div>
            )}

            <div className="quick-stats">
              <h3>Quick Stats</h3>
              <div className="stats-grid">
                <div className="stat-card"><FaHistory /><h4>{serviceHistory.length}</h4><p>Services Completed</p></div>
                <div className="stat-card"><FaCalendarAlt /><h4>{currentBookings.length + upcomingServices.length}</h4><p>Active Bookings</p></div>
                <div className="stat-card"><FaStar /><h4>{serviceHistory.length > 0 ? (serviceHistory.reduce((acc, b) => acc + (b.rating || 0), 0) / serviceHistory.length).toFixed(1) : '0.0'}</h4><p>Average Rating</p></div>
                <div className="stat-card"><span style={{fontSize:'24px'}}>₹</span><h4>{serviceHistory.reduce((acc, b) => acc + (b.amount || 0), 0)}</h4><p>Total Spent</p></div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-section">
            <h3>Service History</h3>
            {serviceHistory.length === 0 ? (
              <div className="empty-state"><FaHistory /><p>No service history yet</p></div>
            ) : (
              <div className="service-list">
                {serviceHistory.map(service => (
                  <div key={service._id} className="service-item completed">
                    <div className="service-header">
                      <div className="service-info">
                        <h4>{service.service?.title || 'Service'}</h4>
                        <p>{service.service?.provider?.name || 'Company'}</p>
                      </div>
                      <div className="service-status">
                        {getStatusIcon(service.status)}
                        <span style={{ color: getStatusColor(service.status) }}>{service.status.charAt(0).toUpperCase() + service.status.slice(1)}</span>
                      </div>
                    </div>
                    <div className="service-details">
                      <div className="detail"><FaCalendarAlt /><span>{new Date(service.date).toLocaleDateString()}</span></div>
                      <div className="detail"><span style={{fontSize:'18px'}}>₹</span><span>{service.amount || service.service?.price || 'N/A'}</span></div>
                      <div className="detail"><FaStar /><span>{renderStars(service.rating || 0)}</span></div>
                    </div>
                    {service.review && <div className="service-review"><p>"{service.review}"</p></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h3>Current Bookings</h3>
            {currentBookings.length === 0 ? (
              <div className="empty-state"><FaCalendarAlt /><p>No current bookings</p></div>
            ) : (
              <div className="service-list">
                {currentBookings.map(booking => (
                  <div key={booking._id} className="service-item booking">
                    <div className="service-header">
                      <div className="service-info">
                        <h4>{booking.service?.title || 'Service'}</h4>
                        <p>{booking.service?.provider?.name || 'Company'}</p>
                      </div>
                      <div className="service-status">
                        {getStatusIcon(booking.status)}
                        <span style={{ color: getStatusColor(booking.status) }}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                      </div>
                    </div>
                    <div className="service-details">
                      <div className="detail"><FaCalendarAlt /><span>{booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'Date TBD'}</span></div>
                      <div className="detail"><FaClock /><span>{booking.preferredTime || 'Time TBD'}</span></div>
                      <div className="detail"><span style={{fontSize:'18px'}}>₹</span><span>{booking.amount || booking.service?.price || 'Price TBD'}</span></div>
                    </div>
                    {booking.details && <div className="service-details-text"><p>{booking.details}</p></div>}
                    <div className="booking-actions">
                      <button className="cancel-booking-btn" onClick={() => handleCancelBooking(booking._id)}>Cancel Booking</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Services Tab */}
        {activeTab === 'upcoming' && (
          <div className="upcoming-section">
            <h3>Upcoming Services</h3>
            {upcomingServices.length === 0 ? (
              <div className="empty-state"><FaCalendarAlt /><p>No upcoming services</p></div>
            ) : (
              <div className="service-list">
                {upcomingServices.map(service => (
                  <div key={service._id} className="service-item upcoming">
                    <div className="service-header">
                      <div className="service-info">
                        <h4>{service.service?.title || 'Service'}</h4>
                        <p>{service.service?.provider?.name || 'Company'}</p>
                      </div>
                      <div className="service-status">
                        {getStatusIcon(service.status)}
                        <span style={{ color: getStatusColor(service.status) }}>{service.status.charAt(0).toUpperCase() + service.status.slice(1)}</span>
                      </div>
                    </div>
                    <div className="service-details">
                      <div className="detail"><FaCalendarAlt /><span>{service.preferredDate ? new Date(service.preferredDate).toLocaleDateString() : 'Date TBD'}</span></div>
                      <div className="detail"><FaClock /><span>{service.preferredTime || 'Time TBD'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
