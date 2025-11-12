const express = require("express");
const User = require("../models/User");
const Booking = require("../models/Booking");

const router = express.Router();

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });
  
  try {
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = "your_jwt_secret";
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Admin only middleware
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Get all users with their booking stats
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get all users except admins
    const users = await User.find({ role: { $ne: 'admin' } })
      .select("-password -adminCode")
      .sort({ createdAt: -1 });

    // For each user, get their booking statistics
    const usersWithStats = await Promise.all(users.map(async (user) => {
      let bookingStats = { bookingsCount: 0, totalSpent: 0, lastBooking: null };
      
      if (user.role === 'customer') {
        // Get customer booking stats
        const bookings = await Booking.find({ customer: user._id });
        bookingStats.bookingsCount = bookings.length;
        bookingStats.totalSpent = bookings.reduce((sum, booking) => {
          return sum + (parseFloat(booking.amount) || 0);
        }, 0);
        
        if (bookings.length > 0) {
          const lastBooking = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          bookingStats.lastBooking = lastBooking.createdAt;
        }
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city: user.city,
        state: user.state,
        isActive: user.isActive,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        companyName: user.companyName,
        serviceProvided: user.serviceProvided,
        providerStats: user.providerStats,
        ...bookingStats
      };
    }));

    res.json({ 
      users: usersWithStats,
      totalCount: usersWithStats.length
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user by ID with detailed info
router.get("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -adminCode");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get detailed booking history for this user
    let bookings = [];
    if (user.role === 'customer') {
      bookings = await Booking.find({ customer: user._id })
        .populate('service', 'title category price')
        .sort({ createdAt: -1 });
    } else if (user.role === 'provider') {
      const Service = require("../models/Service");
      const services = await Service.find({ provider: user._id });
      const serviceIds = services.map(s => s._id);
      bookings = await Booking.find({ service: { $in: serviceIds } })
        .populate('service', 'title category price')
        .sort({ createdAt: -1 });
    }

    res.json({
      user: {
        ...user.toObject(),
        bookings: bookings
      }
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user status (activate/deactivate)
router.put("/users/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password -adminCode");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user 
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update provider approval status
router.put("/users/:id/approval", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { isApproved } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== 'provider') {
      return res.status(400).json({ error: "Only providers can be approved/rejected" });
    }

    user.isApproved = isApproved;
    await user.save();

    res.json({ 
      message: `Provider ${isApproved ? 'approved' : 'rejected'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error("Error updating provider approval:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete user
router.delete("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({ error: "Cannot delete admin users" });
    }

    // Delete associated bookings if customer
    if (user.role === 'customer') {
      await Booking.deleteMany({ customer: user._id });
    }

    // Delete associated services if provider
    if (user.role === 'provider') {
      const Service = require("../models/Service");
      await Service.deleteMany({ provider: user._id });
      
      // Also delete bookings for those services
      const serviceIds = await Service.find({ provider: user._id }).distinct('_id');
      await Booking.deleteMany({ service: { $in: serviceIds } });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get admin dashboard stats
router.get("/dashboard-stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const activeUsers = await User.countDocuments({ role: { $ne: 'admin' }, isActive: true });
    const pendingProviders = await User.countDocuments({ role: 'provider', isApproved: false });
    
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
    ]);

    // Get services count
    const Service = require("../models/Service");
    const totalServices = await Service.countDocuments();

    res.json({
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        active: activeUsers,
        pendingProviders
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        revenue: totalRevenue[0]?.total || 0
      },
      services: {
        total: totalServices
      }
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all services with provider info
router.get("/services", authMiddleware, adminOnly, async (req, res) => {
  try {
    const Service = require("../models/Service");
    const services = await Service.find()
      .populate('provider', 'name companyName email phone')
      .sort({ createdAt: -1 });

    // Add computed fields for each service
    const servicesWithStats = await Promise.all(services.map(async (service) => {
      // Count bookings for this service
      const bookingsCount = await Booking.countDocuments({ service: service._id });
      
      // Calculate average rating from bookings (assuming bookings have rating field)
      const bookingsWithRatings = await Booking.find({ 
        service: service._id, 
        rating: { $exists: true } 
      }).select('rating');
      
      const totalRating = bookingsWithRatings.reduce((sum, booking) => sum + (booking.rating || 0), 0);
      const avgRating = bookingsWithRatings.length > 0 ? (totalRating / bookingsWithRatings.length).toFixed(1) : 0;
      
      return {
        ...service.toObject(),
        bookingsCount,
        rating: parseFloat(avgRating),
        reviews: bookingsWithRatings.length,
        teamMembers: [] // Empty array since this feature isn't implemented yet
      };
    }));

    res.json({ 
      services: servicesWithStats,
      totalCount: servicesWithStats.length
    });
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all bookings with customer and service info
router.get("/bookings", authMiddleware, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('service', 'title category price provider')
      .populate({
        path: 'service',
        populate: {
          path: 'provider',
          select: 'name companyName email phone'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ 
      bookings,
      totalCount: bookings.length
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update booking status
router.put("/bookings/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customer', 'name email')
     .populate('service', 'title provider');

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ 
      message: `Booking status updated to ${status}`,
      booking 
    });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete service
router.delete("/services/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const Service = require("../models/Service");
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Delete associated bookings
    await Booking.deleteMany({ service: req.params.id });

    // Delete service
    await Service.findByIdAndDelete(req.params.id);

    res.json({ message: "Service and associated bookings deleted successfully" });
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update service status (activate/deactivate)
router.put("/services/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const Service = require("../models/Service");
    
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Toggle the isActive status
    service.isActive = !service.isActive;
    await service.save();

    res.json({ 
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      service: {
        _id: service._id,
        title: service.title,
        isActive: service.isActive
      }
    });
  } catch (err) {
    console.error("Error updating service status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get recent activity for admin dashboard
router.get("/recent-activity", authMiddleware, adminOnly, async (req, res) => {
  try {
    const activities = [];
    
    // Get recent users (last 10)
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt');
    
    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user._id}`,
        type: "user",
        action: `New ${user.role} registered`,
        user: user.name,
        time: user.createdAt,
        icon: user.role === 'provider' ? "🏢" : "👤"
      });
    });

    // Get recent bookings (last 5)
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .populate('service', 'title')
      .select('customer service status createdAt amount');
    
    recentBookings.forEach(booking => {
      activities.push({
        id: `booking_${booking._id}`,
        type: "booking",
        action: `New booking created`,
        user: booking.customer?.name || 'Unknown Customer',
        time: booking.createdAt,
        icon: "📋",
        details: booking.service?.title
      });
    });

    // Get recent payments (completed bookings with amounts)
    const recentPayments = await Booking.find({ status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('customer', 'name')
      .select('customer amount updatedAt');
    
    recentPayments.forEach(payment => {
      activities.push({
        id: `payment_${payment._id}`,
        type: "payment",
        action: `Payment received`,
        user: `₹${payment.amount}`,
        time: payment.updatedAt,
        icon: "💰",
        details: `from ${payment.customer?.name || 'Unknown Customer'}`
      });
    });

    // Sort all activities by time (most recent first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Return only the most recent 10 activities
    const limitedActivities = activities.slice(0, 10);

    res.json({ 
      activities: limitedActivities
    });
  } catch (err) {
    console.error("Error fetching recent activity:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;