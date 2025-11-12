import React, { useState, useEffect } from "react";

function BookingManagement({ onMessage }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    
    try {
      setLoading(true);
      
      const response = await fetch("http://localhost:5000/api/admin/bookings", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Bookings fetched:", data);
      
      setBookings(data.bookings || []);
      
    } catch (err) {
      console.error("Error fetching bookings:", err);
      onMessage("Failed to load bookings: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Booking status updated:", data);
      
      setBookings(bookings.map(booking => 
        booking._id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ));
      
      onMessage(`Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating booking status:", err);
      onMessage("Failed to update booking status: " + err.message, "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#48bb78';
      case 'confirmed': return '#4299e1';
      case 'pending': return '#ecc94b';
      case 'cancelled': return '#e53e3e';
      default: return '#a0aec0';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = (booking.bookingId && booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (booking.customer?.name && booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (booking.service?.title && booking.service.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === "all" || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <h2>Booking Management</h2>
        <div className="section-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bookings-stats">
        <div className="booking-stat">
          <span className="stat-number">{bookings.length}</span>
          <span className="stat-label">Total Bookings</span>
        </div>
        <div className="booking-stat">
          <span className="stat-number">{bookings.filter(b => b.status === 'completed').length}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="booking-stat">
          <span className="stat-number">{bookings.filter(b => b.status === 'pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="booking-stat">
          <span className="stat-number">₹{bookings.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0).toLocaleString()}</span>
          <span className="stat-label">Total Revenue</span>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking Details</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Provider</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => (
              <tr key={booking._id}>
                <td>
                  <div className="booking-info">
                    <div className="booking-id">#{booking._id}</div>
                    <div className="booking-date">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                    {booking.serviceDate && (
                      <div className="service-date">
                        Service: {new Date(booking.serviceDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">{booking.customer?.name || 'Unknown Customer'}</div>
                    <div className="customer-contact">
                      {booking.customer?.email || booking.userEmail || 'N/A'}
                    </div>
                    {booking.customer?.phone && (
                      <div className="customer-phone">{booking.customer.phone}</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="service-info">
                    <div className="service-title">{booking.service?.title || 'Service Deleted'}</div>
                    <div className="service-category">{booking.service?.category || 'N/A'}</div>
                  </div>
                </td>
                <td>
                  <div className="provider-info">
                    <div className="provider-name">
                      {booking.service?.provider?.companyName || booking.service?.provider?.name || 'Unknown Provider'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="amount-info">
                    <div className="total-amount">₹{parseFloat(booking.amount || 0).toLocaleString()}</div>
                  </div>
                </td>
                <td>
                  <div className="status-info">
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    {booking.status === 'pending' && (
                      <button 
                        className="btn-confirm"
                        onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                      >
                        Confirm
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button 
                        className="btn-complete"
                        onClick={() => handleStatusUpdate(booking._id, 'completed')}
                      >
                        Complete
                      </button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button 
                        className="btn-cancel"
                        onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBookings.length === 0 && (
        <div className="empty-state">
          <p>No bookings found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default BookingManagement;