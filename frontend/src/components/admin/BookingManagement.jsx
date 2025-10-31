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
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockBookings = [
        {
          _id: "booking1",
          bookingId: "BK001",
          customer: {
            _id: "c1",
            name: "John Doe",
            email: "john@example.com",
            phone: "9876543210"
          },
          service: {
            _id: "s1",
            title: "Professional House Cleaning",
            category: "Cleaning"
          },
          provider: {
            _id: "p1",
            name: "ABC Cleaning Services",
            businessName: "ABC Professional Cleaning"
          },
          serviceDate: new Date(2024, 10, 5),
          timeSlot: "10:00 AM - 12:00 PM",
          address: "123 Main St, Apartment 4B, Mumbai",
          totalAmount: 1500,
          status: "completed",
          paymentStatus: "paid",
          createdAt: new Date(2024, 9, 28),
          completedAt: new Date(2024, 10, 5),
          notes: "Regular cleaning service"
        },
        {
          _id: "booking2",
          bookingId: "BK002",
          customer: {
            _id: "c2",
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "8765432109"
          },
          service: {
            _id: "s2",
            title: "AC Repair & Maintenance",
            category: "Repair"
          },
          provider: {
            _id: "p2",
            name: "XYZ Repair Solutions",
            businessName: "XYZ Electronics Repair"
          },
          serviceDate: new Date(2024, 10, 3),
          timeSlot: "2:00 PM - 4:00 PM",
          address: "456 Oak Avenue, Delhi",
          totalAmount: 800,
          status: "confirmed",
          paymentStatus: "paid",
          createdAt: new Date(2024, 9, 30),
          notes: "AC not cooling properly"
        },
        {
          _id: "booking3",
          bookingId: "BK003",
          customer: {
            _id: "c3",
            name: "Mike Johnson",
            email: "mike@example.com",
            phone: "7654321098"
          },
          service: {
            _id: "s3",
            title: "Plumbing Services",
            category: "Repair"
          },
          provider: {
            _id: "p3",
            name: "Home Care Experts",
            businessName: "Professional Home Care"
          },
          serviceDate: new Date(2024, 10, 8),
          timeSlot: "9:00 AM - 11:00 AM",
          address: "789 Pine Street, Bangalore",
          totalAmount: 600,
          status: "pending",
          paymentStatus: "pending",
          createdAt: new Date(2024, 10, 1),
          notes: "Kitchen sink blockage"
        },
        {
          _id: "booking4",
          bookingId: "BK004",
          customer: {
            _id: "c4",
            name: "Sarah Wilson",
            email: "sarah@example.com",
            phone: "6543210987"
          },
          service: {
            _id: "s4",
            title: "Carpet Cleaning",
            category: "Cleaning"
          },
          provider: {
            _id: "p1",
            name: "ABC Cleaning Services",
            businessName: "ABC Professional Cleaning"
          },
          serviceDate: new Date(2024, 9, 25),
          timeSlot: "1:00 PM - 3:00 PM",
          address: "321 Elm Road, Chennai",
          totalAmount: 1200,
          status: "cancelled",
          paymentStatus: "refunded",
          createdAt: new Date(2024, 9, 20),
          cancelledAt: new Date(2024, 9, 23),
          notes: "Customer requested cancellation"
        }
      ];
      
      setBookings(mockBookings);
      
    } catch (err) {
      console.error("Error fetching bookings:", err);
      onMessage("Failed to load bookings", "error");
    } finally {
      setLoading(false);
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#48bb78';
      case 'pending': return '#ecc94b';
      case 'refunded': return '#ed8936';
      case 'failed': return '#e53e3e';
      default: return '#a0aec0';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const bookingStats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0)
  };

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
          <span className="stat-number">{bookingStats.total}</span>
          <span className="stat-label">Total Bookings</span>
        </div>
        <div className="booking-stat">
          <span className="stat-number">{bookingStats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="booking-stat">
          <span className="stat-number">{bookingStats.confirmed}</span>
          <span className="stat-label">Confirmed</span>
        </div>
        <div className="booking-stat">
          <span className="stat-number">{bookingStats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="booking-stat">
          <span className="stat-number">₹{bookingStats.totalRevenue.toLocaleString()}</span>
          <span className="stat-label">Revenue</span>
        </div>
      </div>

      <div className="bookings-list">
        {filteredBookings.map(booking => (
          <div key={booking._id} className="booking-card">
            <div className="booking-header">
              <div className="booking-id">
                <h3>#{booking.bookingId}</h3>
                <span className="booking-date">
                  Created: {booking.createdAt.toLocaleDateString()}
                </span>
              </div>
              <div className="booking-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {booking.status.toUpperCase()}
                </span>
                <span 
                  className="payment-badge"
                  style={{ backgroundColor: getPaymentStatusColor(booking.paymentStatus) }}
                >
                  {booking.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="booking-details">
              <div className="detail-section">
                <h4>Customer Details</h4>
                <p><strong>{booking.customer.name}</strong></p>
                <p>{booking.customer.email}</p>
                <p>{booking.customer.phone}</p>
              </div>

              <div className="detail-section">
                <h4>Service Details</h4>
                <p><strong>{booking.service.title}</strong></p>
                <p>Category: {booking.service.category}</p>
                <p>Provider: {booking.provider.name}</p>
              </div>

              <div className="detail-section">
                <h4>Appointment Details</h4>
                <p>Date: {booking.serviceDate.toLocaleDateString()}</p>
                <p>Time: {booking.timeSlot}</p>
                <p>Address: {booking.address}</p>
              </div>

              <div className="detail-section">
                <h4>Payment Details</h4>
                <p className="amount">Amount: ₹{booking.totalAmount}</p>
                <p>Status: {booking.paymentStatus}</p>
                {booking.completedAt && (
                  <p>Completed: {booking.completedAt.toLocaleDateString()}</p>
                )}
                {booking.cancelledAt && (
                  <p>Cancelled: {booking.cancelledAt.toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className="booking-notes">
                <h4>Notes:</h4>
                <p>{booking.notes}</p>
              </div>
            )}
          </div>
        ))}
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