import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

function ServiceList() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [bookingStatus, setBookingStatus] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/service")
      .then(res => res.json())
      .then(data => setServices(data.services || []));
  }, []);

  const handleBook = async (serviceId) => {
    setBookingStatus("");
    if (!user || user.role !== "customer") {
      setBookingStatus("Please login as a customer to book.");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/booking/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ serviceId })
      });
      const data = await res.json();
      if (res.ok) {
        setBookingStatus("Service booked successfully!");
      } else {
        setBookingStatus(data.error || "Booking failed.");
      }
    } catch {
      setBookingStatus("Network error.");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h2>Available Services</h2>
      {bookingStatus && <div style={{ color: "green", marginBottom: "12px" }}>{bookingStatus}</div>}
      <ul>
        {services.map(s => (
          <li key={s._id} style={{ marginBottom: "16px", padding: "8px", border: "1px solid #eee", borderRadius: "6px" }}>
            <strong>{s.title}</strong> ({s.category}) - ₹{s.price} <br />
            {s.description} <br />
            Location: {s.location} <br />
            Provider: {s.provider?.name}
            <br />
            {user && user.role === "customer" && (
              <button onClick={() => handleBook(s._id)} style={{ marginTop: "8px" }}>
                Book Service
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ServiceList;