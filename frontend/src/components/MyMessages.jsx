import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

function MyMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
      fetchMessages(user.email);
    }
  }, [user]);

  const fetchMessages = async (userEmail) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5000/api/contact/my-messages?email=${encodeURIComponent(userEmail)}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      fetchMessages(email.trim());
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "#3b82f6",
      read: "#10b981", 
      replied: "#8b5cf6"
    };
    return colors[status] || "#6b7280";
  };

  const getStatusText = (status) => {
    const texts = {
      new: "New",
      read: "Read by Admin",
      replied: "Replied"
    };
    return texts[status] || status;
  };

  return (
    <div className="my-messages-container">
      <div className="my-messages-header">
        <h1>My Contact Messages</h1>
        <p>View your contact messages and admin replies</p>
      </div>

      {!user && (
        <form onSubmit={handleEmailSubmit} className="email-form">
          <div className="form-group">
            <label htmlFor="email">Enter your email to view messages:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : "View Messages"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading your messages...</span>
        </div>
      )}

      {!loading && messages.length === 0 && !error && email && (
        <div className="no-messages">
          <div className="no-messages-icon">📮</div>
          <h3>No messages found</h3>
          <p>You haven't sent any contact messages yet, or no messages found for this email address.</p>
        </div>
      )}

      {!loading && messages.length > 0 && (
        <div className="messages-list">
          <div className="messages-count">
            Found {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
          
          {messages.map((message) => (
            <div key={message._id} className="message-card">
              <div className="message-header">
                <div className="message-info">
                  <h3>Message sent on {formatDate(message.createdAt)}</h3>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(message.status) }}
                  >
                    {getStatusText(message.status)}
                  </div>
                </div>
              </div>

              <div className="message-content">
                <h4>Your Message:</h4>
                <div className="user-message">
                  {message.message}
                </div>

                {message.adminReply && (
                  <div className="admin-reply-section">
                    <h4>Admin Reply:</h4>
                    <div className="admin-reply">
                      {message.adminReply}
                    </div>
                    {message.repliedAt && (
                      <div className="reply-meta">
                        <small>
                          Replied on {formatDate(message.repliedAt)}
                          {message.repliedBy && ` by ${message.repliedBy.username}`}
                        </small>
                      </div>
                    )}
                  </div>
                )}

                {message.status === 'read' && !message.adminReply && (
                  <div className="status-info">
                    <span className="status-icon">👀</span>
                    Your message has been read by our admin team. You should receive a reply soon.
                  </div>
                )}

                {message.status === 'new' && (
                  <div className="status-info">
                    <span className="status-icon">📨</span>
                    Your message has been received. Our team will review it shortly.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyMessages;