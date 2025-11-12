import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, FaHistory, FaCalendarAlt, FaStar, FaEdit, FaPhone, FaEnvelope, 
  FaMapMarkerAlt, FaClock, FaCheckCircle, FaSpinner, FaTimes, FaTools, FaMoneyBillWave,
  FaChevronDown, FaChevronUp, FaUsers, FaCreditCard, FaExclamationTriangle
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
  const [pendingPayments, setPendingPayments] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    upiId: '',
    paymentMethod: 'credit'
  });

  // For providers
  const [myServices, setMyServices] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [earnings, setEarnings] = useState(0);

  // For admins
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalServices: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

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

      // Fetch accurate earnings calculation
      fetch(`http://localhost:5000/api/booking/provider/earnings`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log("� Provider earnings data:", data);
          if (data.success) {
            setEarnings(data.totalEarnings || 0);
            if (data.wasUpdated) {
              console.log("✅ Provider earnings were recalculated and updated");
            }
          }
        })
        .catch(err => {
          console.error("Error fetching provider earnings:", err);
          // Fallback to manual calculation if earnings endpoint fails
          fetch(`http://localhost:5000/api/booking/provider`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
          })
            .then(res => res.json())
            .then(data => {
              const bookings = data.bookings || [];
              const completedBookings = bookings.filter(b => b.status === 'completed');
              const calculatedEarnings = completedBookings.reduce((total, booking) => {
                const amount = parseFloat(booking.amount) || parseFloat(booking.service?.price) || 0;
                return total + amount;
              }, 0);
              setEarnings(calculatedEarnings);
            });
        });
    } else {
      // Fetch user's bookings
      fetch(`http://localhost:5000/api/booking/my`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          const bookings = data.bookings || [];
          const completedBookings = bookings.filter(b => b.status === 'completed');
          const pendingPaymentBookings = bookings.filter(b => b.status === 'completed' && b.paymentStatus !== 'paid');
          
          setServiceHistory(completedBookings);
          setCurrentBookings(bookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)));
          setUpcomingServices(bookings.filter(b => b.status === 'scheduled'));
          setPendingPayments(pendingPaymentBookings);
          
          console.log("📊 Customer bookings loaded:");
          console.log("Total bookings:", bookings.length);
          console.log("Completed bookings:", completedBookings.length);
          console.log("Pending payments:", pendingPaymentBookings.length);
          completedBookings.forEach(booking => {
            console.log(`Booking ${booking._id}: amount="${booking.amount}", service.price="${booking.service?.price}", paymentStatus="${booking.paymentStatus}"`);
          });
        })
        .catch(err => console.error("Error fetching user bookings:", err));

      // Fetch accurate spending calculation
      fetch(`http://localhost:5000/api/booking/customer/spending`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log("💰 Customer spending data:", data);
          if (data.success) {
            setTotalSpent(data.totalSpent || 0);
          }
        })
        .catch(err => {
          console.error("Error fetching customer spending:", err);
          // Fallback to manual calculation
          setTotalSpent(0); // Will be calculated from serviceHistory
        });
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
    } else if (user.role === "admin") {
      // Fetch admin dashboard stats
      fetch("http://localhost:5000/api/admin/dashboard-stats", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          setAdminStats({
            totalUsers: data.users?.total || 0,
            totalProviders: data.users?.providers || 0,
            totalServices: data.services?.total || 0,
            totalBookings: data.bookings?.total || 0,
            totalRevenue: data.bookings?.revenue || 0,
            pendingApprovals: data.users?.pendingProviders || 0
          });
        })
        .catch(err => console.error("Error fetching admin stats:", err));

      // Fetch recent activity
      fetch("http://localhost:5000/api/admin/recent-activity", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => setRecentActivity(data.activities || []))
        .catch(err => console.error("Error fetching recent activity:", err));
        
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
    
    console.log(`🌟 Submitting review: Rating ${reviewRating}, Comment: "${reviewComment}"`);
    
    fetch(`http://localhost:5000/api/booking/${selectedBooking._id}/review`, {
      method: 'POST',
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        rating: Number(reviewRating),
        comment: reviewComment 
      })
    })
      .then(res => res.json())
      .then((data) => {
        console.log("Review submission response:", data);
        
        if (data.error) {
          console.error("Review submission error:", data.error);
          alert("Failed to submit review: " + data.error);
          return;
        }
        
        if (data.success) {
          // Refresh booking data
          fetchBookingData();
          setShowReviewModal(false);
          setSelectedBooking(null);
          setReviewRating(5);
          setReviewComment("");
          alert("Review submitted successfully! ⭐");
        } else {
          alert("Review submitted successfully!");
          fetchBookingData();
          setShowReviewModal(false);
        }
      })
      .catch(err => {
        console.error("Error submitting review:", err);
        alert("Failed to submit review. Please try again.");
      });
  };

  // Payment handling functions
  const openPaymentModal = (booking) => {
    setSelectedPayment(booking);
    setPaymentForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      upiId: '',
      paymentMethod: 'credit'
    });
    setShowPaymentModal(true);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with spaces
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.replace(/\s/g, '').length <= 16) {
        setPaymentForm({...paymentForm, [name]: formattedValue});
      }
    } else if (name === 'expiryDate') {
      // Format expiry date as MM/YY
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length <= 5) {
        setPaymentForm({...paymentForm, [name]: formattedValue});
      }
    } else if (name === 'cvv') {
      // Limit CVV to 3-4 digits
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setPaymentForm({...paymentForm, [name]: value});
      }
    } else if (name === 'upiId') {
      // Basic UPI ID validation (allow alphanumeric, dots, hyphens, @)
      if (/^[a-zA-Z0-9.\-@]*$/.test(value)) {
        setPaymentForm({...paymentForm, [name]: value});
      }
    } else {
      setPaymentForm({...paymentForm, [name]: value});
    }
  };

  const processPayment = () => {
    if (!selectedPayment) return;

    // Validate form based on payment method
    if (paymentForm.paymentMethod === 'upi') {
      if (!paymentForm.upiId) {
        alert('Please enter your UPI ID');
        return;
      }
      // Basic UPI ID format validation
      if (!paymentForm.upiId.includes('@') || paymentForm.upiId.length < 5) {
        alert('Please enter a valid UPI ID (e.g., username@paytm)');
        return;
      }
    } else {
      // Card payment validation
      if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.cardholderName) {
        alert('Please fill in all payment details');
        return;
      }
    }

    const bookingAmount = parseFloat(selectedPayment.amount) || 0;
    const servicePrice = parseFloat(selectedPayment.service?.price) || 0;
    const paymentAmount = bookingAmount > 0 ? bookingAmount : servicePrice;

    console.log(`💳 Processing ${paymentForm.paymentMethod} payment for booking ${selectedPayment._id}: ₹${paymentAmount}`);

    const paymentData = {
      paymentMethod: paymentForm.paymentMethod,
      amount: paymentAmount
    };

    // Add payment-specific data
    if (paymentForm.paymentMethod === 'upi') {
      paymentData.upiId = paymentForm.upiId;
    } else {
      paymentData.cardNumber = paymentForm.cardNumber.replace(/\s/g, '');
      paymentData.expiryDate = paymentForm.expiryDate;
      paymentData.cvv = paymentForm.cvv;
    }

    console.log("Payment data being sent:", paymentData);

    fetch(`http://localhost:5000/api/booking/${selectedPayment._id}/payment`, {
      method: 'POST',
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentData)
    })
      .then(res => {
        console.log("Payment response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("Payment response data:", data);
        
        if (!data.success && data.error) {
          console.error("Payment error:", data.error);
          alert("Payment failed: " + data.error);
          return;
        }
        
        // Payment successful
        if (data.success) {
          console.log("✅ Payment successful:", data);
          
          // Extract provider information from booking
          const booking = data.booking;
          if (booking && booking.service && booking.service.provider) {
            setProviderInfo({
              name: booking.service.provider.name || booking.service.provider.companyName || booking.service.provider.username,
              email: booking.service.provider.email,
              phone: booking.service.provider.phone,
              address: booking.service.provider.address,
              serviceName: booking.service.title,
              servicePrice: booking.service.price,
              bookingId: booking._id,
              paymentMethod: paymentForm.paymentMethod
            });
            setShowProviderModal(true);
          } else {
            alert(`Payment successful! Thank you for using our services. ${paymentForm.paymentMethod === 'upi' ? '📱' : '💳'}`);
          }
          
          setShowPaymentModal(false);
          setSelectedPayment(null);
          // Small delay to ensure backend has processed completely
          setTimeout(() => {
            fetchBookingData();
          }, 500);
        } else {
          // Fallback for cases where success field might not be set but payment went through
          console.log("⚠️ Payment completed but success flag unclear:", data);
          alert("Payment processed successfully!");
          setShowPaymentModal(false);
          setSelectedPayment(null);
          setTimeout(() => {
            fetchBookingData();
          }, 500);
        }
      })
      .catch(err => {
        console.error("Network error processing payment:", err);
        alert("Network error occurred. Please check if payment was processed and refresh the page.");
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
            {user.role === "admin" ? (
              <>
                <div className="stat">
                  <span className="stat-number">{adminStats.totalUsers}</span>
                  <span className="stat-label">Total Users</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{adminStats.totalProviders}</span>
                  <span className="stat-label">Service Providers</span>
                </div>
                <div className="stat">
                  <span className="stat-number">₹{adminStats.totalRevenue}</span>
                  <span className="stat-label">Platform Revenue</span>
                </div>
              </>
            ) : user.role === "provider" ? (
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
        {user.role === "admin" ? (
          <>
            <button className={`tab ${activeTab === 'platform-stats' ? 'active' : ''}`} onClick={() => setActiveTab('platform-stats')}>Platform Stats</button>
            <button className={`tab ${activeTab === 'recent-activity' ? 'active' : ''}`} onClick={() => setActiveTab('recent-activity')}>Recent Activity</button>
            <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('/admin/dashboard')}>Admin Dashboard</button>
          </>
        ) : user.role === "provider" ? (
          <>
            <button className={`tab ${activeTab === 'myservices' ? 'active' : ''}`} onClick={() => setActiveTab('myservices')}>My Services</button>
            <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Bookings</button>
          </>
        ) : (
          <>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Service History</button>
            <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Current Bookings</button>
            <button className={`tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
              Payments {pendingPayments.length > 0 && <span className="payment-badge">{pendingPayments.length}</span>}
            </button>
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
            ) : user.role === "admin" ? (
              <div className="quick-stats">
                <h3>Platform Overview</h3>
                <div className="stats-grid">
                  <div className="stat-card"><FaUsers /><h4>{adminStats.totalUsers}</h4><p>Total Users</p></div>
                  <div className="stat-card"><FaTools /><h4>{adminStats.totalServices}</h4><p>Services Listed</p></div>
                  <div className="stat-card"><FaCalendarAlt /><h4>{adminStats.totalBookings}</h4><p>Total Bookings</p></div>
                  <div className="stat-card"><FaMoneyBillWave /><h4>₹{adminStats.totalRevenue}</h4><p>Platform Revenue</p></div>
                  {adminStats.pendingApprovals > 0 && (
                    <div className="stat-card urgent">
                      <FaClock /><h4>{adminStats.pendingApprovals}</h4><p>Pending Approvals</p>
                    </div>
                  )}
                </div>
                <div className="admin-quick-actions">
                  <h4>Quick Actions</h4>
                  <div className="admin-action-buttons">
                    <button className="admin-action-btn" onClick={() => navigate('/admin/dashboard')}>
                      <FaTools /> Full Admin Dashboard
                    </button>
                    {adminStats.pendingApprovals > 0 && (
                      <button className="admin-action-btn urgent" onClick={() => navigate('/admin/dashboard')}>
                        <FaClock /> Review Pending Approvals ({adminStats.pendingApprovals})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="quick-stats">
                <h3>Quick Stats</h3>
                <div className="stats-grid">
                  <div className="stat-card"><FaHistory /><h4>{serviceHistory.length}</h4><p>Services Completed</p></div>
                  <div className="stat-card"><FaCalendarAlt /><h4>{currentBookings.length + upcomingServices.length}</h4><p>Active Bookings</p></div>
                  <div className="stat-card">
                    <span style={{fontSize:'24px'}}>₹</span>
                    <h4>
                      {(totalSpent > 0 ? totalSpent : serviceHistory.reduce((acc, b) => {
                        const bookingAmount = parseFloat(b.amount) || 0;
                        const servicePrice = parseFloat(b.service?.price) || 0;
                        const amount = bookingAmount > 0 ? bookingAmount : servicePrice;
                        return acc + amount;
                      }, 0)).toLocaleString()}
                    </h4>
                    <p>Total Spent</p>
                  </div>
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
                      {service.paymentStatus === 'paid' ? (
                        <div className="detail payment-status-paid">
                          <FaCheckCircle /> <span>Payment Complete</span>
                        </div>
                      ) : (
                        <div className="detail payment-status-pending">
                          <FaExclamationTriangle /> <span>Payment Pending</span>
                        </div>
                      )}
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
                    {service.paymentStatus !== 'paid' && (
                      <div className="service-actions">
                        <button 
                          className="pay-now-btn"
                          onClick={() => openPaymentModal(service)}
                        >
                          <FaCreditCard /> Pay Now
                        </button>
                      </div>
                    )}
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

        {/* Customer Payments Tab */}
        {user.role !== "provider" && activeTab === 'payments' && (
          <div className="payments-section">
            <h3>Payment Management</h3>
            
            {pendingPayments.length > 0 && (
              <div className="pending-payments">
                <div className="payment-alert">
                  <FaExclamationTriangle />
                  <span>You have {pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''}</span>
                </div>
                
                <h4>Pending Payments</h4>
                <div className="payment-list">
                  {pendingPayments.map(payment => {
                    const amount = parseFloat(payment.amount) || parseFloat(payment.service?.price) || 0;
                    return (
                      <div key={payment._id} className="payment-item pending">
                        <div className="payment-info">
                          <h5>{payment.service?.title || payment.companyName || 'Service'}</h5>
                          <p>{payment.service?.provider?.name || 'Service Provider'}</p>
                          <div className="payment-details">
                            <span className="payment-amount">₹{amount}</span>
                            <span className="payment-date">{new Date(payment.completedAt || payment.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="payment-actions">
                          <button 
                            className="pay-btn"
                            onClick={() => openPaymentModal(payment)}
                          >
                            <FaCreditCard /> Pay Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="payment-history">
              <h4>Payment History</h4>
              {serviceHistory.filter(s => s.paymentStatus === 'paid').length === 0 ? (
                <div className="empty-state">
                  <FaCreditCard />
                  <p>No payment history yet</p>
                </div>
              ) : (
                <div className="payment-list">
                  {serviceHistory.filter(s => s.paymentStatus === 'paid').map(payment => {
                    const amount = parseFloat(payment.amount) || parseFloat(payment.service?.price) || 0;
                    return (
                      <div key={payment._id} className="payment-item completed">
                        <div className="payment-info">
                          <h5>{payment.service?.title || payment.companyName || 'Service'}</h5>
                          <p>{payment.service?.provider?.name || 'Service Provider'}</p>
                          <div className="payment-details">
                            <span className="payment-amount">₹{amount}</span>
                            <span className="payment-date">{new Date(payment.paymentDetails?.processedAt || payment.updatedAt).toLocaleDateString()}</span>
                            {payment.paymentDetails?.method === 'upi' ? (
                              <span className="payment-method-indicator upi-indicator">📱 UPI</span>
                            ) : (
                              <span className="payment-method-indicator card-indicator">💳 Card</span>
                            )}
                            {payment.paymentDetails?.transactionId && (
                              <span className="transaction-id">ID: {payment.paymentDetails.transactionId.slice(-8)}</span>
                            )}
                          </div>
                        </div>
                        <div className="payment-status">
                          <FaCheckCircle className="paid-icon" />
                          <span>Paid</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

        {/* Admin Platform Stats Tab */}
        {user.role === "admin" && activeTab === 'platform-stats' && (
          <div className="admin-stats-section">
            <h3>Platform Statistics</h3>
            <div className="detailed-stats">
              <div className="stats-row">
                <div className="detailed-stat-card">
                  <div className="stat-icon"><FaUsers /></div>
                  <div className="stat-content">
                    <h4>Users & Providers</h4>
                    <div className="stat-breakdown">
                      <p>Total Users: {adminStats.totalUsers}</p>
                      <p>Service Providers: {adminStats.totalProviders}</p>
                      <p>Pending Approvals: {adminStats.pendingApprovals}</p>
                    </div>
                  </div>
                </div>
                
                <div className="detailed-stat-card">
                  <div className="stat-icon"><FaTools /></div>
                  <div className="stat-content">
                    <h4>Services & Bookings</h4>
                    <div className="stat-breakdown">
                      <p>Active Services: {adminStats.totalServices}</p>
                      <p>Total Bookings: {adminStats.totalBookings}</p>
                      <p>Platform Revenue: ₹{adminStats.totalRevenue}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="platform-actions">
                <h4>Platform Management</h4>
                <div className="action-grid">
                  <button 
                    className="platform-action-btn"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    <FaUsers /> User Management
                  </button>
                  <button 
                    className="platform-action-btn"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    <FaTools /> Service Management
                  </button>
                  <button 
                    className="platform-action-btn"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    <FaCalendarAlt /> Booking Management
                  </button>
                  {adminStats.pendingApprovals > 0 && (
                    <button 
                      className="platform-action-btn urgent"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      <FaClock /> Approve Providers ({adminStats.pendingApprovals})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Recent Activity Tab */}
        {user.role === "admin" && activeTab === 'recent-activity' && (
          <div className="admin-activity-section">
            <h3>Recent Platform Activity</h3>
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <FaHistory />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{activity.icon || '📊'}</div>
                    <div className="activity-content">
                      <p className="activity-text">{activity.action}</p>
                      <p className="activity-user">{activity.user}</p>
                      {activity.details && (
                        <p className="activity-details">{activity.details}</p>
                      )}
                    </div>
                    <div className="activity-time">{activity.timeAgo || activity.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Payment</h3>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-summary">
                <h4>Service Details</h4>
                <div className="service-summary">
                  <h5>{selectedPayment.service?.title || selectedPayment.companyName || 'Service'}</h5>
                  <p>{selectedPayment.service?.provider?.name || 'Service Provider'}</p>
                  <div className="amount-display">
                    ₹{parseFloat(selectedPayment.amount) || parseFloat(selectedPayment.service?.price) || 0}
                  </div>
                </div>
              </div>

              <div className="payment-form">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    name="paymentMethod" 
                    value={paymentForm.paymentMethod} 
                    onChange={handlePaymentFormChange}
                  >
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="upi">UPI Payment</option>
                  </select>
                </div>

                {paymentForm.paymentMethod === 'upi' ? (
                  // UPI Payment Form
                  <div className="upi-payment-form">
                    <div className="form-group">
                      <label>UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        value={paymentForm.upiId}
                        onChange={handlePaymentFormChange}
                        placeholder="username@paytm / 9876543210@ybl"
                        required
                      />
                      <small className="form-help">Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe, mobile@upi)</small>
                    </div>
                    
                    <div className="upi-apps">
                      <p>Supported UPI Apps:</p>
                      <div className="upi-app-list">
                        <span className="upi-app">📱 PhonePe</span>
                        <span className="upi-app">💰 Paytm</span>
                        <span className="upi-app">🏦 Google Pay</span>
                        <span className="upi-app">💳 BHIM</span>
                        <span className="upi-app">🅿️ PayU</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Card Payment Form
                  <>
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        name="cardholderName"
                        value={paymentForm.cardholderName}
                        onChange={handlePaymentFormChange}
                        placeholder="Full name as on card"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentForm.cardNumber}
                        onChange={handlePaymentFormChange}
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={paymentForm.expiryDate}
                          onChange={handlePaymentFormChange}
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          name="cvv"
                          value={paymentForm.cvv}
                          onChange={handlePaymentFormChange}
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button className="submit-btn pay-btn-modal" onClick={processPayment}>
                <FaCreditCard /> Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Provider Information Modal */}
      {showProviderModal && providerInfo && (
        <div className="modal-overlay" onClick={() => setShowProviderModal(false)}>
          <div className="provider-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎉 Payment Successful!</h3>
              <button className="close-btn" onClick={() => setShowProviderModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-success-info">
                <div className="success-icon">✅</div>
                <h4>Thank you for your payment!</h4>
                <p>Your service has been booked successfully. Here are your provider details:</p>
              </div>

              <div className="provider-details">
                <div className="provider-card">
                  <div className="provider-header">
                    <div className="provider-avatar">
                      {providerInfo.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div className="provider-info">
                      <h3>{providerInfo.name || 'Service Provider'}</h3>
                      <p className="provider-title">Your Service Provider</p>
                    </div>
                  </div>

                  <div className="service-summary">
                    <h4>Service Booked:</h4>
                    <div className="service-item">
                      <span className="service-name">{providerInfo.serviceName}</span>
                      <span className="service-price">₹{providerInfo.servicePrice}</span>
                    </div>
                    <div className="payment-info">
                      <span className="payment-method">
                        Paid via {providerInfo.paymentMethod === 'upi' ? 'UPI 📱' : 'Card 💳'}
                      </span>
                    </div>
                  </div>

                  <div className="provider-contact">
                    <h4>Contact Information:</h4>
                    <div className="contact-item">
                      <FaEnvelope className="contact-icon" />
                      <span>{providerInfo.email || 'Not provided'}</span>
                    </div>
                    {providerInfo.phone && (
                      <div className="contact-item">
                        <FaPhone className="contact-icon" />
                        <span>{providerInfo.phone}</span>
                      </div>
                    )}
                    {providerInfo.address && (
                      <div className="contact-item">
                        <FaMapMarkerAlt className="contact-icon" />
                        <span>{providerInfo.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="next-steps">
                    <h4>What's Next?</h4>
                    <ul>
                      <li>✅ Your booking has been confirmed</li>
                      <li>📞 The provider will contact you soon</li>
                      <li>📅 Service will be scheduled as per your convenience</li>
                      <li>⭐ Don't forget to rate your experience after service completion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="submit-btn" onClick={() => setShowProviderModal(false)}>
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;