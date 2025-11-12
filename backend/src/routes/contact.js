const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret - should match the one used in auth.js
const JWT_SECRET = "your_jwt_secret";

// Middleware to verify admin access
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Submit contact message
router.post('/submit', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Please fill in all fields"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address"
      });
    }

    // Create new contact message
    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully! We'll get back to you soon.",
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        createdAt: contact.createdAt
      }
    });

  } catch (err) {
    console.error("Contact submission error:", err);
    res.status(500).json({
      error: "Failed to send message. Please try again.",
      details: err.message
    });
  }
});

// Get all contact messages (admin only)
router.get('/messages', verifyAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    if (status && ['new', 'read', 'replied'].includes(status)) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const messages = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get status counts
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      new: 0,
      read: 0,
      replied: 0,
      total: total
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.json({
      success: true,
      messages,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      counts
    });

  } catch (err) {
    console.error("Error fetching contact messages:", err);
    res.status(500).json({
      error: "Failed to fetch contact messages",
      details: err.message
    });
  }
});

// Update message status (admin only)
router.patch('/messages/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, adminReply } = req.body;

    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'new', 'read', or 'replied'"
      });
    }

    const updateData = { status };
    
    if (status === 'read' && !await Contact.findOne({ _id: id, readAt: { $exists: true } })) {
      updateData.readAt = new Date();
    }
    
    if (status === 'replied') {
      updateData.repliedAt = new Date();
      updateData.repliedBy = req.user._id;
      if (!await Contact.findOne({ _id: id, readAt: { $exists: true } })) {
        updateData.readAt = new Date();
      }
      
      // Admin reply is required when marking as replied
      if (!adminReply || adminReply.trim() === '') {
        return res.status(400).json({
          error: "Admin reply is required when marking message as replied"
        });
      }
      updateData.adminReply = adminReply.trim();
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes.trim();
    }

    if (adminReply !== undefined && status !== 'replied') {
      updateData.adminReply = adminReply.trim();
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('repliedBy', 'username');

    if (!contact) {
      return res.status(404).json({
        error: "Contact message not found"
      });
    }

    res.json({
      success: true,
      message: `Message marked as ${status}`,
      contact
    });

  } catch (err) {
    console.error("Error updating message status:", err);
    res.status(500).json({
      error: "Failed to update message status",
      details: err.message
    });
  }
});

// Get user's own contact messages and replies
router.get('/my-messages', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: "Email parameter is required"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address"
      });
    }

    const messages = await Contact.find({ 
      email: email.toLowerCase().trim() 
    })
    .populate('repliedBy', 'username')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      messages,
      count: messages.length
    });

  } catch (err) {
    console.error("Error fetching user messages:", err);
    res.status(500).json({
      error: "Failed to fetch messages",
      details: err.message
    });
  }
});

// Delete message (admin only)
router.delete('/messages/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        error: "Contact message not found"
      });
    }

    res.json({
      success: true,
      message: "Contact message deleted successfully"
    });

  } catch (err) {
    console.error("Error deleting contact message:", err);
    res.status(500).json({
      error: "Failed to delete contact message",
      details: err.message
    });
  }
});

module.exports = router;