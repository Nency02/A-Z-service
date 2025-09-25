import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import "./Auth.css";

function Signup() {
  const [step, setStep] = useState(1); // Step 1: Role selection, Step 2: Form
  const [role, setRole] = useState(""); // customer or provider
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    serviceInterest: "" // only for provider
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showNotification } = useNotification();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2); // move to next step
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }

    // Additional validation for provider
    if (role === "provider") {
      if (!form.phone.trim()) {
        setError("Phone number is required");
        return false;
      }
      if (!form.address.trim()) {
        setError("Address is required");
        return false;
      }
      if (!form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
        setError("Complete address is required");
        return false;
      }
      if (!form.serviceInterest.trim()) {
        setError("Service interest is required");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await signup(
        form.name,
        form.email,
        form.password,
        role,
        form.phone,
        form.address,
        form.city,
        form.state,
        form.pincode,
        form.serviceInterest
      );

      if (result.success) {
        showNotification("Account created successfully!", "success");
        navigate("/login");
      } else {
        setError(result.error || "Signup failed");
        showNotification(result.error || "Signup failed", "error");
      }
    } catch {
      setError("An unexpected error occurred");
      showNotification("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {step === 1 ? (
        <div className="auth-form">
          <h2>Select Account Type</h2>
          <div className="role-buttons">
            <button
              type="button"
              className="role-btn"
              onClick={() => handleRoleSelect("customer")}
            >
              Customer
            </button>
            <button
              type="button"
              className="role-btn"
              onClick={() => handleRoleSelect("provider")}
            >
              Service Provider
            </button>
          </div>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{role === "customer" ? "Customer Signup" : "Provider Signup"}</h2>
          {error && <div className="error-message">{error}</div>}

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />

          {/* Provider-specific fields */}
          {role === "provider" && (
            <>
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={form.state}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={form.pincode}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="serviceInterest"
                placeholder="Service Interested In"
                value={form.serviceInterest}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default Signup;
