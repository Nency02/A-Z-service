import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setMessageType("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setMessage(data.error || "Failed to send message. Please try again.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setMessage("Network error. Please check your connection and try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="contact-content">
        <h2>Contact Us</h2>
        
        {message && (
          <div className={`contact-message ${messageType}`}>
            {message}
          </div>
        )}
        
        <form className="contact-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="name"
            placeholder="Your Name" 
            value={formData.name}
            onChange={handleChange}
            required 
            disabled={loading}
          />
          <input 
            type="email" 
            name="email"
            placeholder="Your Email" 
            value={formData.email}
            onChange={handleChange}
            required 
            disabled={loading}
          />
          <textarea 
            name="message"
            placeholder="Your Message" 
            rows={4} 
            value={formData.message}
            onChange={handleChange}
            required
            disabled={loading}
          ></textarea>
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
        
        <div className="contact-info">
          <p><strong>Address:</strong> Ahmedabad, Gujarat, India</p>
          <p><strong>Phone:</strong> +91 98765 43210</p>
          <p><strong>Email:</strong> contact@azglobe-gujarat.com</p>
          
          <div className="view-messages-section">
            <button 
              className="view-messages-btn"
              onClick={() => navigate('/my-messages')}
            >
              📬 View My Messages & Replies
            </button>
            <small>Check admin replies to your contact messages</small>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;