import React, { useState, useEffect } from "react";

function ContactManagement({ onMessage }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminReply, setAdminReply] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0
  });

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  const fetchContacts = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    if (!token) {
      onMessage("Please log in as an administrator", "error");
      setLoading(false);
      return;
    }
    
    try {
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(`http://localhost:5000/api/contact/messages${statusParam}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.messages || []);
        setStats(data.counts || { total: 0, new: 0, read: 0, replied: 0 });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch contacts:", response.status, response.statusText, errorData);
        
        if (response.status === 401) {
          onMessage("Authentication failed. Please log in again.", "error");
        } else if (response.status === 403) {
          onMessage("Access denied. Administrator privileges required.", "error");
        } else {
          onMessage(errorData.error || "Failed to fetch contact messages", "error");
        }
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      onMessage("Network error while fetching contacts", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId, newStatus) => {
    const token = localStorage.getItem("token");
    
    try {
      const requestBody = { 
        status: newStatus,
        adminNotes: adminNotes 
      };
      
      // Add admin reply if marking as replied
      if (newStatus === 'replied') {
        if (!adminReply.trim()) {
          onMessage("Please enter a reply message before marking as replied", "error");
          return;
        }
        requestBody.adminReply = adminReply.trim();
      }
      
      const response = await fetch(`http://localhost:5000/api/contact/messages/${contactId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        onMessage(data.message, "success");
        fetchContacts();
        setShowModal(false);
        setSelectedContact(null);
        setAdminNotes("");
        setAdminReply("");
      } else {
        const error = await response.json();
        onMessage(error.error || "Failed to update contact status", "error");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      onMessage("Network error while updating contact", "error");
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact message?")) {
      return;
    }

    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`http://localhost:5000/api/contact/messages/${contactId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        onMessage("Contact message deleted successfully", "success");
        fetchContacts();
      } else {
        onMessage("Failed to delete contact message", "error");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      onMessage("Network error while deleting contact", "error");
    }
  };

  const openContactModal = (contact) => {
    setSelectedContact(contact);
    setAdminNotes(contact.adminNotes || "");
    setAdminReply(contact.adminReply || "");
    setShowModal(true);
    
    // Mark as read if it's new
    if (contact.status === "new") {
      updateContactStatus(contact._id, "read");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: { text: "New", class: "status-new" },
      read: { text: "Read", class: "status-read" },
      replied: { text: "Replied", class: "status-replied" }
    };
    
    return badges[status] || { text: status, class: "status-default" };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeDifference = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? "Just now" : `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="contact-management">
      {/* Stats Header */}
      <div className="contact-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total Messages</span>
        </div>
        <div className="stat-item new">
          <span className="stat-number">{stats.new}</span>
          <span className="stat-label">New</span>
        </div>
        <div className="stat-item read">
          <span className="stat-number">{stats.read}</span>
          <span className="stat-label">Read</span>
        </div>
        <div className="stat-item replied">
          <span className="stat-number">{stats.replied}</span>
          <span className="stat-label">Replied</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={filter === "all" ? "active" : ""} 
          onClick={() => setFilter("all")}
        >
          All Messages ({stats.total})
        </button>
        <button 
          className={filter === "new" ? "active" : ""} 
          onClick={() => setFilter("new")}
        >
          New ({stats.new})
        </button>
        <button 
          className={filter === "read" ? "active" : ""} 
          onClick={() => setFilter("read")}
        >
          Read ({stats.read})
        </button>
        <button 
          className={filter === "replied" ? "active" : ""} 
          onClick={() => setFilter("replied")}
        >
          Replied ({stats.replied})
        </button>
      </div>

      {/* Contact Messages List */}
      <div className="contacts-list">
        {loading ? (
          <div className="loading">Loading contact messages...</div>
        ) : contacts.length === 0 ? (
          <div className="no-contacts">
            <div className="no-contacts-icon">📮</div>
            <h3>No contact messages</h3>
            <p>Contact messages will appear here when customers reach out</p>
          </div>
        ) : (
          contacts.map(contact => {
            const statusBadge = getStatusBadge(contact.status);
            
            return (
              <div 
                key={contact._id} 
                className={`contact-item ${contact.status === 'new' ? 'unread' : ''}`}
                onClick={() => openContactModal(contact)}
              >
                <div className="contact-header">
                  <div className="contact-info">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-email">{contact.email}</span>
                  </div>
                  <div className="contact-meta">
                    <span className={`status-badge ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                    <span className="contact-time">
                      {getTimeDifference(contact.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="contact-preview">
                  {contact.message.length > 100 
                    ? contact.message.substring(0, 100) + "..."
                    : contact.message
                  }
                </div>
                
                <div className="contact-actions">
                  <button 
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteContact(contact._id);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contact Details Modal */}
      {showModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact Message Details</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="contact-details">
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedContact.name}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedContact.email}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`status-badge ${getStatusBadge(selectedContact.status).class}`}>
                    {getStatusBadge(selectedContact.status).text}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Received:</label>
                  <span>{formatDate(selectedContact.createdAt)}</span>
                </div>
              </div>

              <div className="message-content">
                <label>Message:</label>
                <div className="message-text">{selectedContact.message}</div>
              </div>

              <div className="admin-notes">
                <label>Admin Notes:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your internal notes here..."
                  rows={3}
                />
              </div>

              <div className="admin-reply">
                <label>Admin Reply (will be sent to user):</label>
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Write your reply to the customer here..."
                  rows={4}
                />
                {selectedContact.adminReply && (
                  <div className="existing-reply">
                    <strong>Current Reply:</strong>
                    <div className="reply-text">{selectedContact.adminReply}</div>
                    {selectedContact.repliedBy && (
                      <small>Replied by: {selectedContact.repliedBy.username}</small>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="btn replied"
                  onClick={() => updateContactStatus(selectedContact._id, "replied")}
                  disabled={!adminReply.trim()}
                >
                  Send Reply & Mark as Replied
                </button>
                {selectedContact.status === "new" && (
                  <button 
                    className="btn read"
                    onClick={() => updateContactStatus(selectedContact._id, "read")}
                  >
                    Mark as Read
                  </button>
                )}
                <button 
                  className="btn save-notes"
                  onClick={() => updateContactStatus(selectedContact._id, selectedContact.status)}
                >
                  Save Notes
                </button>
                <button 
                  className="btn delete"
                  onClick={() => {
                    setShowModal(false);
                    deleteContact(selectedContact._id);
                  }}
                >
                  Delete Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactManagement;