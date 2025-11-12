import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import CompanySelector from "./CompanySelector";
import CompanyDetails from "./CompanyDetails";
// Note: We now store bookings in the database, but keep this for backward compatibility if needed
// import { addBooking } from "../utils/bookingTracker";
import "./BookServiceModal.css";

  const serviceOptions = [
    "Cleaning",
    "Plumbing", 
    "Electrician",
    "IT Support",
    "Pest Control",
    "Carpentry",
    "Painting",
    "Gardening",
    "Appliance Repair",
    "Security Services"
  ];

  // Map frontend display names to database categories if needed
  const categoryMapping = {
    "Home Cleaning": "cleaning",
    "Cleaning": "cleaning"
  };function BookServiceModal({ open, onClose, onBookingSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    details: "",
    preferredDate: "",
    preferredTime: ""
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  if (!open) return null;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    
    // Reset company selection when service changes
    if (e.target.name === 'service') {
      setSelectedCompany(null);
    }
  };

  const handleLoginRedirect = () => {
    onClose();
    navigate("/login");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!form.service) {
      setError("Please select a service");
      return false;
    }
    if (!selectedCompany) {
      setError("Please select a service company");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Extract numeric price from priceRange (e.g., "₹500-₹1000" -> 500)
    const extractPrice = (priceRange) => {
      if (!priceRange) return 0;
      // Handle direct service price (number)
      if (typeof priceRange === 'number') return priceRange;
      // Handle service price as string
      const match = priceRange.toString().match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    const numericAmount = selectedCompany?.price 
      ? extractPrice(selectedCompany.price) 
      : extractPrice(selectedCompany?.priceRange);

    console.log(`💰 Price extraction: ${selectedCompany?.priceRange || selectedCompany?.price} -> ${numericAmount}`);

    // Create booking data
    const bookingData = {
      userId: user.id,
      userName: form.name,
      userEmail: form.email,
      userPhone: form.phone,
      service: form.service,
      company: selectedCompany.name,
      companyId: selectedCompany.id,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      details: form.details,
      amount: numericAmount.toString() // Convert back to string as expected by backend
    };

    // Send booking request to backend (also keep local tracker for immediate UI)
    try {
      const token = localStorage.getItem("token");
      console.log("🚀 Sending booking request:", bookingData);
      console.log("🔑 Token:", token ? "Present" : "Missing");
      
      const res = await fetch("http://localhost:5000/api/booking/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          // Send serviceId if selectedCompany has real service data
          serviceId: selectedCompany?.id || null,
          companyName: bookingData.company,
          companyId: bookingData.companyId,
          userName: bookingData.userName,
          userEmail: bookingData.userEmail,
          userPhone: bookingData.userPhone,
          preferredDate: bookingData.preferredDate,
          preferredTime: bookingData.preferredTime,
          details: bookingData.details,
          amount: bookingData.amount
        })
      });

      const data = await res.json();
      console.log("📨 Server response:", data);
      console.log("📊 Response status:", res.status);
      
      if (!res.ok) {
        console.error("❌ Booking failed:", data);
        setError(data.error || "Failed to submit booking");
        return;
      }

      // Note: No longer using local tracker since we're persisting to database
      // Local tracker is no longer needed as data comes from the backend

      setSubmitted(true);
      showNotification(`Service request submitted successfully! ${selectedCompany.name} will contact you soon.`, "success");
      
      // Trigger callback to refresh parent component data
      if (onBookingSuccess) {
        onBookingSuccess(data.booking);
      }

      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setForm({ 
          name: "", 
          email: "", 
          phone: "",
          service: "", 
          details: "",
          preferredDate: "",
          preferredTime: ""
        });
        setSelectedCompany(null);
      }, 2000);
    } catch (err) {
      console.error("Network error booking:", err);
      setError("Network error. Please try again later.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>📋 Book a Service</h2>
          <p className="modal-subtitle">Find and book professional services near you</p>
        </div>
        
        {!user && (
          <div className="login-prompt">
            <div className="login-prompt-content">
              <div className="prompt-icon">🔐</div>
              <div className="prompt-text">
                <strong>Login Required</strong>
                <p>Please login to book services and get personalized recommendations.</p>
              </div>
            </div>
            <button onClick={handleLoginRedirect} className="login-btn">
              Login Now
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {submitted ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Booking Submitted Successfully!</h3>
            <p>Thank you! Your service request has been submitted.</p>
            <div className="success-details">
              <span className="company-name">{selectedCompany?.name}</span> will contact you within 24 hours to confirm the details.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-section">
              <h3 className="section-title">👤 Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">🔧 Service Details</h3>
              <div className="form-group">
                <label htmlFor="service">Select Service Type *</label>
                <select
                  id="service"
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  required
                  className="service-select"
                >
                  <option value="">Choose a service...</option>
                  {serviceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              {/* Company Selection */}
              {form.service && (
                <div className="company-selection">
                  <CompanySelector
                    serviceName={categoryMapping[form.service] || form.service.toLowerCase()}
                    selectedCompany={selectedCompany}
                    onCompanySelect={setSelectedCompany}
                  />
                </div>
              )}
              
              {/* Selected Company Details */}
              {selectedCompany && (
                <div className="company-details">
                  <CompanyDetails company={selectedCompany} />
                </div>
              )}
            </div>

            <div className="form-section">
              <h3 className="section-title">📅 Schedule & Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="preferredDate">Preferred Date</label>
                  <input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    value={form.preferredDate}
                    onChange={handleChange}
                    className="date-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="preferredTime">Preferred Time</label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    value={form.preferredTime}
                    onChange={handleChange}
                    className="time-select"
                  >
                    <option value="">Select time slot</option>
                    <option value="morning">🌅 Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">☀️ Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">🌆 Evening (5 PM - 8 PM)</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="details">Additional Details</label>
                <textarea
                  id="details"
                  name="details"
                  placeholder="Tell us more about what you need... (optional)"
                  value={form.details}
                  onChange={handleChange}
                  rows={3}
                  className="details-textarea"
                />
              </div>
            </div>
            
            <button type="submit" className="submit-btn">
              <span className="btn-text">
                {selectedCompany ? `📞 Book with ${selectedCompany.name}` : "🚀 Submit Service Request"}
              </span>
              <span className="btn-arrow">→</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BookServiceModal;