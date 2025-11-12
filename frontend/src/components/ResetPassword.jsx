import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Auth.css";

function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
      return;
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setFormData({ password: "", confirmPassword: "" });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Invalid Reset Link</h2>
          <p>The password reset link is invalid or missing.</p>
          <button onClick={() => navigate("/forgot-password")}>
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Reset Your Password</h2>
        <p>Enter your new password below.</p>

        {error && (
          <div style={{ 
            background: "#fee", 
            border: "1px solid #fcc", 
            padding: "10px", 
            borderRadius: "5px", 
            color: "#c33",
            marginBottom: "15px" 
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ 
            background: "#efe", 
            border: "1px solid #cfc", 
            padding: "10px", 
            borderRadius: "5px", 
            color: "#363",
            marginBottom: "15px" 
          }}>
            {message}
            <br />
            <small>Redirecting to login in 3 seconds...</small>
          </div>
        )}

        <input
          type="password"
          name="password"
          placeholder="New Password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          disabled={loading || message}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm New Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          minLength={6}
          disabled={loading || message}
        />

        <button 
          type="submit" 
          disabled={loading || message}
          style={{
            background: loading ? "#ccc" : "",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <p>
            Remember your password? <a href="/login">Login</a>
          </p>
          <p>
            Need a new reset link? <a href="/forgot-password">Click here</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default ResetPassword;