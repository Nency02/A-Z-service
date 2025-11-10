import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, FaHistory, FaCalendarAlt, FaStar, FaEdit, FaPhone, FaEnvelope, 
  FaMapMarkerAlt, FaClock, FaCheckCircle, FaSpinner, FaTimes, FaTools, FaMoneyBillWave,
  FaChevronDown, FaChevronUp, FaUsers
} from 'react-icons/fa';
import './Profile.css';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [expandedService, setExpandedService] = useState(null); // Track expanded service
  const [employees, setEmployees] = useState([]); // Store employees data
  
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  // For users
  const [serviceHistory, setServiceHistory] = useState([]);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);

  // For providers
  const [myServices, setMyServices] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [earnings, setEarnings] = useState(0);

  const [loading, setLoading] = useState(true);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Function to fetch booking data
  const fetchBookingData = useCallback(() => {
    if (!user) return;
    
    if (user.role === "provider") {
      // Fetch bookings for provider's services
      fetch(`http://localhost:5000/api/booking/provider`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          setProviderBookings(data.bookings || []);
        })
        .catch(err => console.error("Error fetching provider bookings:", err));
      
      // Fetch provider stats (total earnings from database)
      fetch(`http://localhost:5000/api/auth/profile`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user?.providerStats) {
            setEarnings(data.user.providerStats.totalEarnings || 0);
          }
        })
        .catch(err => console.error("Error fetching provider stats:", err));
    } else {
      // Fetch user's bookings
      fetch(`http://localhost:5000/api/booking/my`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          const bookings = data.bookings || [];
          setServiceHistory(bookings.filter(b => b.status === 'completed'));
          setCurrentBookings(bookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)));
          setUpcomingServices(bookings.filter(b => b.status === 'scheduled'));
        })
        .catch(err => console.error("Error fetching user bookings:", err));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    if (user.role === "provider") {
      // Fetch provider's services
      fetch(`http://localhost:5000/api/service/my`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => setMyServices(data.services || []))
        .catch(err => console.error("Error fetching services:", err));

      // Fetch employees
      fetch(`http://localhost:5000/api/employee/my`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => setEmployees(data.employees || []))
        .catch(err => console.error("Error fetching employees:", err));

      // Fetch booking data
      fetchBookingData();
      setLoading(false);
    } else {
      // Fetch booking data
      fetchBookingData();
      setLoading(false);
    }
  }, [user, navigate, fetchBookingData]);

  // Listen for booking updates from other components
  useEffect(() => {
    const handleBookingUpdate = () => {
      fetchBookingData();
    };

    window.addEventListener('bookingUpdated', handleBookingUpdate);
    window.addEventListener('bookingCancelled', handleBookingUpdate);
    window.addEventListener('bookingStatusChanged', handleBookingUpdate);
    
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
      window.removeEventListener('bookingCancelled', handleBookingUpdate);
      window.removeEventListener('bookingStatusChanged', handleBookingUpdate);
    };
  }, [fetchBookingData]);

  // Toggle service expansion
  const toggleServiceExpansion = (serviceId) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  // Get employees for a specific service
  const getServiceEmployees = (serviceId) => {
    return employees.filter(emp => emp.service?._id === serviceId);
  };

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
      .then(() => setIsEditing(false))
      .catch(err => console.error("Error updating profile:", err));
  };

  const handleCancelBooking = (bookingId) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      fetch(`http://localhost:5000/api/booking/${bookingId}/cancel`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then((data) => {
          if (data.error) {
            alert("Failed to cancel booking: " + data.error);
            return;
          }
          // Refresh booking data from server
          fetchBookingData();
          // Emit event for real-time updates
          window.dispatchEvent(new CustomEvent('bookingCancelled', { detail: { bookingId } }));
          alert("Booking cancelled successfully!");
        })
        .catch(err => {
          console.error("Error canceling booking:", err);
          alert("Failed to cancel booking");
        });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle />;
      case 'pending': return <FaSpinner />;
      case 'confirmed': return <FaCheckCircle />;
      case 'cancelled': return <FaTimes />;
      default: return <FaClock />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar key={i} style={{ color: i < rating ? '#fbbf24' : '#d1d5db' }} />
    ));
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    fetch(`http://localhost:5000/api/booking/${bookingId}/status`, {
      method: 'PUT',
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Update status error:", data.error);
          alert("Failed to update booking status: " + data.error);
          return;
        }
        // Refresh booking data
        fetchBookingData();
        // Emit event for real-time updates
        window.dispatchEvent(new CustomEvent('bookingStatusChanged', { detail: { bookingId, newStatus } }));
        alert(`Booking ${newStatus} successfully!`);
      })
      .catch(err => {
        console.error("Error updating booking status:", err);
        alert("Failed to update booking status");
      });
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
  };

  const submitReview = () => {
    if (!selectedBooking) return;
    
    fetch(`http://localhost:5000/api/booking/${selectedBooking._id}/review`, {
      method: 'POST',
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        rating: reviewRating,
        comment: reviewComment 
      })
    })
      .then(res => res.json())
      .then((data) => {
        if (data.error) {
          alert("Failed to submit review: " + data.error);
          return;
        }
        // Refresh booking data
        fetchBookingData();
        setShowReviewModal(false);
        alert("Review submitted successfully!");
      })
      .catch(err => {
        console.error("Error submitting review:", err);
        alert("Failed to submit review");
      });
  };



  if (!user || loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <div className="profile-stats">
            {user.role === "provider" ? (
              <>
                <div className="stat">
                  <span className="stat-number">{myServices.length}</span>
                  <span className="stat-label">Services Offered</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{providerBookings.length}</span>
                  <span className="stat-label">Total Bookings</span>
                </div>
                <div className="stat">
                  <span className="stat-number">₹{earnings}</span>
                  <span className="stat-label">Total Earnings</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        <button className="edit-profile-btn" onClick={() => setIsEditing(!isEditing)}>
          <FaEdit /> {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        {user.role === "provider" ? (
          <>
            <button className={`tab ${activeTab === 'myservices' ? 'active' : ''}`} onClick={() => setActiveTab('myservices')}>My Services</button>
            <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Bookings</button>
          </>
        ) : (
          <>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Service History</button>
            <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Current Bookings</button>
            <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming Services</button>
          </>
        )}
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

            {user.role === "provider" ? (
              <div className="quick-stats">
                <h3>Provider Stats</h3>
                <div className="stats-grid">
                  <div className="stat-card"><FaTools /><h4>{myServices.length}</h4><p>Services Offered</p></div>
                  <div className="stat-card"><FaCalendarAlt /><h4>{providerBookings.length}</h4><p>Total Bookings</p></div>
                  <div className="stat-card"><FaMoneyBillWave /><h4>₹{earnings}</h4><p>Total Earnings</p></div>
                </div>
              </div>
            ) : (
              <div className="quick-stats">
                <h3>Quick Stats</h3>
                <div className="stats-grid">
                  <div className="stat-card"><FaHistory /><h4>{serviceHistory.length}</h4><p>Services Completed</p></div>
                  <div className="stat-card"><FaCalendarAlt /><h4>{currentBookings.length + upcomingServices.length}</h4><p>Active Bookings</p></div>
                  <div className="stat-card"><FaStar /><h4>{serviceHistory.length > 0 ? (serviceHistory.reduce((acc, b) => acc + (b.rating || 0), 0) / serviceHistory.length).toFixed(1) : '0.0'}</h4><p>Average Rating</p></div>
                  <div className="stat-card"><span style={{fontSize:'24px'}}>₹</span><h4>{serviceHistory.reduce((acc, b) => acc + (b.amount || 0), 0)}</h4><p>Total Spent</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Provider My Services Tab - COMPACT EXPANDABLE CARDS */}
        {user.role === "provider" && activeTab === 'myservices' && (
          <div className="myservices-section">
            <h3>My Services</h3>
            {myServices.length === 0 ? (
              <div className="empty-state"><FaTools /><p>No services added yet</p></div>
            ) : (
              <div className="services-grid">
                {myServices.map(service => {
                  const serviceEmployees = getServiceEmployees(service._id);
                  const isExpanded = expandedService === service._id;
                  
                  return (
                    <div key={service._id} className={`service-card ${isExpanded ? 'expanded' : ''}`}>
                      {/* Compact Service Card */}
                      <div 
                        className="service-card-header" 
                        onClick={() => toggleServiceExpansion(service._id)}
                      >
                        <div className="service-image-small">
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
                            <div className="service-image-placeholder-small">
                              <FaTools />
                            </div>
                          )}
                          {service.image && (
                            <div className="service-image-placeholder-small" style={{ display: 'none' }}>
                              <FaTools />
                            </div>
                          )}
                        </div>
                        
                        <div className="service-card-info">
                          <h4>{service.title}</h4>
                          <p className="service-category">{service.category}</p>
                          <div className="service-meta">
                            <span className="service-price">₹{service.price}</span>
                            <span className="service-location">{service.location}</span>
                          </div>
                          <div className="service-team-count">
                            <FaUsers /> {serviceEmployees.length} team member{serviceEmployees.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="expand-icon">
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="service-card-expanded">
                          <div className="service-description">
                            <h5>Service Description</h5>
                            <p>{service.description || 'No description available'}</p>
                          </div>
                          
                          <div className="service-team">
                            <h5>Team Members</h5>
                            {serviceEmployees.length === 0 ? (
                              <p className="no-employees">No employees assigned to this service</p>
                            ) : (
                              <div className="employees-grid">
                                {serviceEmployees.map(employee => (
                                  <div key={employee._id} className="employee-card">
                                    <div className="employee-photo">
                                      {employee.image ? (
                                        <img 
                                          src={`http://localhost:5000${employee.image}`} 
                                          alt={employee.name}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : (
                                        <div className="employee-placeholder">
                                          {employee.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      {employee.image && (
                                        <div className="employee-placeholder" style={{ display: 'none' }}>
                                          {employee.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="employee-details">
                                      <h6>{employee.name}</h6>
                                      <p><FaPhone /> {employee.phone}</p>
                                      {employee.email && <p><FaEnvelope /> {employee.email}</p>}
                                      {employee.specialization && <p><strong>Specialist:</strong> {employee.specialization}</p>}
                                      {employee.experience && <p><strong>Experience:</strong> {employee.experience}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rest of the tabs remain the same */}
        {/* Provider Bookings Tab */}
        {user.role === "provider" && activeTab === 'bookings' && (
          <div className="provider-bookings-section">
            <h3>Bookings for My Services</h3>

            {providerBookings.length === 0 ? (
              <div className="empty-state"><FaCalendarAlt /><p>No bookings yet</p></div>
            ) : (
              <div className="service-list">
                {providerBookings.map(booking => (
                  <div key={booking._id} className="service-item booking">
                    <div className="service-header">
                      <div className="service-info">
                        <h4>{booking.service?.title || 'Service'}</h4>
                        <p>Customer: {booking.customer?.name || 'User'}</p>
                        {booking.customer?.phone && <p>📞 {booking.customer.phone}</p>}
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
                    
                    {/* Status Update Controls */}
                    <div className="booking-actions">
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            className="status-btn confirm-btn" 
                            onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                          >
                            Confirm Booking
                          </button>
                          <button 
                            className="status-btn cancel-btn" 
                            onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button 
                          className="status-btn progress-btn" 
                          onClick={() => updateBookingStatus(booking._id, 'in-progress')}
                        >
                          Start Service
                        </button>
                      )}
                      {booking.status === 'in-progress' && (
                        <button 
                          className="status-btn complete-btn" 
                          onClick={() => updateBookingStatus(booking._id, 'completed')}
                        >
                          Mark Complete
                        </button>
                      )}
                      {booking.status === 'completed' && booking.review?.rating && (
                        <div className="review-display">
                          <p>⭐ {booking.review.rating}/5</p>
                          {booking.review.comment && <p>"{booking.review.comment}"</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User tabs remain the same as before */}
        {user.role !== "provider" && activeTab === 'history' && (
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
                        <h4>{service.service?.title || service.companyName || 'Service'}</h4>
                        <p>{service.service?.provider?.name || service.companyName || service.service?.category || 'Service Provider'}</p>
                      </div>
                      <div className="service-status">
                        {getStatusIcon(service.status)}
                        <span style={{ color: getStatusColor(service.status) }}>{service.status.charAt(0).toUpperCase() + service.status.slice(1)}</span>
                      </div>
                    </div>
                    <div className="service-details">
                      <div className="detail"><FaCalendarAlt /><span>{new Date(service.date || service.createdAt).toLocaleDateString()}</span></div>
                      <div className="detail"><span style={{fontSize:'18px'}}>₹</span><span>{service.amount || service.service?.price || 'N/A'}</span></div>
                      {service.review?.rating ? (
                        <div className="detail"><FaStar /><span>{renderStars(service.review.rating)}</span></div>
                      ) : (
                        <div className="detail">
                          <button 
                            className="review-btn" 
                            onClick={() => openReviewModal(service)}
                          >
                            <FaStar /> Rate Service
                          </button>
                        </div>
                      )}
                    </div>
                    {service.review?.comment && <div className="service-review"><p>"{service.review.comment}"</p></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user.role !== "provider" && activeTab === 'bookings' && (
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
                        <h4>{booking.service?.title || booking.companyName || 'Service'}</h4>
                        <p>{booking.service?.provider?.name || booking.companyName || booking.service?.category || 'Service Provider'}</p>
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

        {user.role !== "provider" && activeTab === 'upcoming' && (
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rate Your Service</h3>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="service-info">
                <h4>{selectedBooking?.service?.title || selectedBooking?.companyName || 'Service'}</h4>
                <p>{selectedBooking?.service?.provider?.name || 'Service Provider'}</p>
              </div>
              
              <div className="rating-input">
                <label>Rating:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FaStar 
                      key={star}
                      className={`star ${star <= reviewRating ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    />
                  ))}
                </div>
              </div>

              <div className="comment-input">
                <label>Comment (optional):</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={submitReview}>
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;