import React from "react";

function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-content">
        <h2>Contact Us</h2>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" rows={4} required></textarea>
          <button type="submit">Send Message</button>
        </form>
        <div className="contact-info">
          <p><strong>Address:</strong> Ahmedabad, Gujarat, India</p>
          <p><strong>Phone:</strong> +91 98765 43210</p>
          <p><strong>Email:</strong> contact@azglobe-gujarat.com</p>
        </div>
      </div>
    </section>
  );
}

export default Contact;