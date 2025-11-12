import React, { useState } from "react";
import "./Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail("");
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <p>Enter your email to receive a password reset link.</p>

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
            {/* Show reset link if email service is not configured */}
            {message.includes("email service not configured") && (
              <div style={{ marginTop: "10px", padding: "10px", background: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "5px" }}>
                <p style={{ margin: "5px 0", fontWeight: "bold", color: "#856404" }}>
                  Development Mode: Email not configured
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px", color: "#856404" }}>
                  Check the backend console for the reset link, or configure email in .env file
                </p>
              </div>
            )}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            background: loading ? "#ccc" : "",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        
        <p>
          Remembered your password? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;
