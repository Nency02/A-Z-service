import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import CompanySelector from "./CompanySelector";
import CompanyDetails from "./CompanyDetails";
import { addBooking } from "../utils/bookingTracker";
import "./BookServiceModal.css";

const serviceOptions = [
  "Home Cleaning",
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

function BookServiceModal({ open, onClose }) {
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

  const handleSubmit = e => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
      amount: selectedCompany.priceRange
    };

    // Add booking to tracker
    const booking = addBooking(bookingData);

    setSubmitted(true);
    showNotification(`Service request submitted successfully! ${selectedCompany.name} will contact you soon.`, "success");
    
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
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Book a Service</h2>
        
        {!user && (
          <div style={{
            margin: "16px 0", 
            padding: "16px", 
            backgroundColor: "#fff3cd", 
            border: "1px solid #ffeaa7",
            borderRadius: "8px",
            color: "#856404",
            textAlign: "center"
          }}>
            <div style={{marginBottom: "12px"}}>
              Please login to book services and get personalized recommendations.
            </div>
            <button 
              onClick={handleLoginRedirect}
              style={{
                background: "#004aad",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Login Now
            </button>
          </div>
        )}

        {error && (
          <div style={{
            margin: "16px 0", 
            padding: "12px", 
            backgroundColor: "#f8d7da", 
            border: "1px solid #f5c6cb",
            borderRadius: "8px",
            color: "#721c24"
          }}>
            {error}
          </div>
        )}

        {submitted ? (
          <div style={{margin: "32px 0", color: "#004aad", fontWeight: "bold", textAlign: "center"}}>
            <div style={{fontSize: "48px", marginBottom: "16px"}}>✓</div>
            <div>Thank you! Your service request has been submitted.</div>
            <div style={{fontSize: "14px", marginTop: "8px", color: "#666"}}>
              {selectedCompany?.name} will contact you within 24 hours to confirm the details.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <input
              name="name"
              type="text"
              placeholder="Your Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Your Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              type="tel"
              placeholder="Your Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              required
              style={{padding: "12px", borderRadius: "8px", border: "1px solid #b3c6e0", background: "#f9fcff", fontSize: "16px"}}
            >
              <option value="">Select Service</option>
              {serviceOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            
            {/* Company Selection */}
            {form.service && (
              <CompanySelector
                serviceName={form.service}
                selectedCompany={selectedCompany}
                onCompanySelect={setSelectedCompany}
              />
            )}
            
            {/* Selected Company Details */}
            {selectedCompany && (
              <CompanyDetails company={selectedCompany} />
            )}
            
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
              <input
                name="preferredDate"
                type="date"
                placeholder="Preferred Date"
                value={form.preferredDate}
                onChange={handleChange}
                style={{padding: "12px", borderRadius: "8px", border: "1px solid #b3c6e0", background: "#f9fcff"}}
              />
              <select
                name="preferredTime"
                value={form.preferredTime}
                onChange={handleChange}
                style={{padding: "12px", borderRadius: "8px", border: "1px solid #b3c6e0", background: "#f9fcff"}}
              >
                <option value="">Preferred Time</option>
                <option value="morning">Morning (9 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                <option value="evening">Evening (5 PM - 8 PM)</option>
              </select>
            </div>
            
            <textarea
              name="details"
              placeholder="Additional Details (optional)"
              value={form.details}
              onChange={handleChange}
              rows={3}
              style={{padding: "12px", borderRadius: "8px", border: "1px solid #b3c6e0", background: "#f9fcff", resize: "vertical"}}
            />
            <button type="submit" style={{
              background: "#004aad",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s ease"
            }}>
              {selectedCompany ? `Book with ${selectedCompany.name}` : "Book Service Now"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BookServiceModal;