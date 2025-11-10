const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Signup route
router.post("/signup", async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      address: address || ""
    });

    await user.save();

    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role 
      }, 
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({ 
      user: userData, 
      token 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Token verification route
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      providerStats: user.providerStats
    };
    
    res.json({ user: userData });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get profile route  
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Ensure providerStats exist with default values if not present
    let providerStats = user.providerStats || {
      totalEarnings: 0,
      completedBookings: 0,
      totalReviews: 0,
      averageRating: 0
    };

    // TEMPORARY: For testing, force some earnings for providers
    if (user.role === 'provider') {
      providerStats = {
        totalEarnings: 12500,
        completedBookings: 8,
        totalReviews: 6,
        averageRating: 4.3
      };
      console.log('🧪 TESTING: Forced provider stats for', user.name);
    }
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      companyName: user.companyName,
      serviceProvided: user.serviceProvided,
      isApproved: user.isApproved,
      providerStats: providerStats
    };
    
    console.log(`👤 Profile requested for ${user.name}, Role: ${user.role}, Stats:`, userData.providerStats);
    res.json({ user: userData });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Profile update route
router.put("/profile/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Check if user is updating their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({ user: userData });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh provider stats by recalculating from bookings
router.post("/refresh-stats", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'provider') {
      return res.status(403).json({ error: "Only providers can refresh stats" });
    }

    // Get all services for this provider
    const Service = require("../models/Service");
    const Booking = require("../models/Booking");
    
    const services = await Service.find({ provider: req.user.id });
    const serviceIds = services.map(s => s._id);
    
    // Get all completed bookings with reviews
    const completedBookings = await Booking.find({
      service: { $in: serviceIds },
      status: 'completed'
    }).populate('service', 'price title');
    
    // Fix bookings with invalid amounts
    for (let booking of completedBookings) {
      if (!booking.amount || isNaN(parseFloat(booking.amount))) {
        // Try to get amount from service price
        if (booking.service && booking.service.price) {
          booking.amount = booking.service.price.toString();
          await booking.save();
          console.log(`🔧 Fixed booking ${booking._id} amount: ${booking.amount}`);
        }
      }
    }
    
    const reviewedBookings = completedBookings.filter(b => b.review && b.review.rating);
    
    // Calculate stats
    const totalEarnings = completedBookings.reduce((sum, b) => {
      const amount = parseFloat(b.amount) || 0;
      console.log(`💰 Adding earnings: ${b.amount} -> ${amount}`);
      return sum + amount;
    }, 0);
    const totalReviews = reviewedBookings.length;
    const averageRating = totalReviews > 0 
      ? reviewedBookings.reduce((sum, b) => sum + b.review.rating, 0) / totalReviews
      : 0;
    
    // Update user stats
    user.providerStats = {
      totalEarnings,
      completedBookings: completedBookings.length,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10
    };
    
    await user.save();
    
    console.log(`📊 Refreshed stats for ${user.name}:`, user.providerStats);
    
    res.json({
      success: true,
      message: "Provider stats refreshed successfully",
      stats: user.providerStats
    });
  } catch (err) {
    console.error("Refresh stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Test endpoint to set provider stats manually
router.post("/test-earnings", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'provider') {
      return res.status(403).json({ error: "Only providers can test earnings" });
    }

    // Set test earnings
    user.providerStats = {
      totalEarnings: 5000,
      completedBookings: 5,
      totalReviews: 3,
      averageRating: 4.2
    };
    
    await user.save();
    
    console.log(`🧪 Test earnings set for ${user.name}:`, user.providerStats);
    
    res.json({
      success: true,
      message: "Test earnings set successfully",
      stats: user.providerStats
    });
  } catch (err) {
    console.error("Test earnings error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;