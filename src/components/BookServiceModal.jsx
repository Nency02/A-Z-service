import React, { useState } from "react";
import "./BookServiceModal.css";

const serviceOptions = [
  "Home Cleaning",
  "Plumbing",
  "Electrician",
  "IT Support",
  "Pest Control"
];

function BookServiceModal({ open, onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    service: "",
    details: ""
  });
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      setForm({ name: "", email: "", service: "", details: "" });
    }, 1800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Book a Service</h2>
        {submitted ? (
          <div style={{margin: "32px 0", color: "#004aad", fontWeight: "bold"}}>
            Thank you! Your request has been submitted.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              required
              style={{padding: "10px", borderRadius: "8px", border: "1px solid #b3c6e0", background: "#f9fcff"}}
            >
              <option value="">Select Service</option>
              {serviceOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <textarea
              name="details"
              placeholder="Details (optional)"
              value={form.details}
              onChange={handleChange}
              rows={3}
            />
            <button type="submit">Book Now</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BookServiceModal;