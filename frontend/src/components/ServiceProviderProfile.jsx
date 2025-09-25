import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./ServiceProviderProfile.css";

function ServiceProviderProfile() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === "provider") {
      fetch("http://localhost:5000/api/service/my", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => setServices(data.services || []))
        .catch(() => setError("Failed to fetch services"));
    }
  }, [user]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/service/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setServices(prev => [...prev, data.service]);
        setForm({ title: "", description: "", category: "", price: "", location: "" });
      } else {
        setError(data.error || "Failed to add service");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  if (!user || user.role !== "provider") {
    return <div className="center-message">Only service providers can access this page.</div>;
  }

  return (
    <div className="profile-container">
      {/* Profile Info */}
      <div className="profile-section">
        <h2>Your Profile</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      {/* Add Service */}
      <div className="profile-section">
        <h3>Add a Service</h3>
      </div>
      <form className="profile-form" onSubmit={handleSubmit}>
        <input name="title" placeholder="Service Title" value={form.title} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
        <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Service"}</button>
        {error && <div className="error-message">{error}</div>}
      </form>

      {/* Your Services */}
      <div className="profile-section">
        <h3>Your Services</h3>
      </div>
      <ul className="services-list">
        {services.map(s => (
          <li key={s._id}>
            <strong>{s.title}</strong> ({s.category}) - ₹{s.price} <br />
            {s.description} <br />
            Location: {s.location}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ServiceProviderProfile;