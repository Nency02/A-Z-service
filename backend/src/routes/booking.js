const express = require("express");
const Booking = require("../models/Booking");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}


// Book a service (customer only)
router.post("/book", authMiddleware, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ error: "Only customers can book services" });
  // Accept either a serviceId (link to Service) or freeform booking request fields
  const {
    serviceId,
    companyName,
    companyId,
    userName,
    userEmail,
    userPhone,
    preferredDate,
    preferredTime,
    details,
    amount
  } = req.body;

  try {
    const bookingPayload = {
      customer: req.user.id,
      status: 'pending'
    };

    if (serviceId) bookingPayload.service = serviceId;
    if (companyName) bookingPayload.companyName = companyName;
    if (companyId) bookingPayload.companyId = companyId;
    if (userName) bookingPayload.userName = userName;
    if (userEmail) bookingPayload.userEmail = userEmail;
    if (userPhone) bookingPayload.userPhone = userPhone;
    if (preferredDate) bookingPayload.preferredDate = preferredDate;
    if (preferredTime) bookingPayload.preferredTime = preferredTime;
    if (details) bookingPayload.details = details;
    if (amount) bookingPayload.amount = amount;

    const booking = await Booking.create(bookingPayload);
    
    // Populate the created booking with any referenced data
    const populatedBooking = await Booking.findById(booking._id)
      .populate("service")
      .populate("customer", "name email");
    
    res.json({ booking: populatedBooking });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get bookings for customer
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate("service")
      .populate("customer", "name email")
      .sort({ date: -1 }); // Most recent first
    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching customer bookings:', err);
    res.status(500).json({ error: "Server error" });
  }
});



// Update booking status (provider only)
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    
    console.log(`📝 Updating booking ${bookingId} status to: ${status}`);
    console.log(`👤 User role: ${req.user.role}, User ID: ${req.user.id}`);
    
    if (!["pending", "confirmed", "in-progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return res.status(404).json({ error: "Booking not found" });
    }
    
    console.log(`📋 Found booking: ${booking._id}, Service: ${booking.service}`);
    
    // Check authorization - providers can update status, customers can cancel their own bookings
    if (req.user.role === "provider") {
      // For providers, check if they own the service (if service exists)
      if (booking.service) {
        const Service = require("../models/Service");
        const service = await Service.findById(booking.service);
        if (service && service.provider.toString() !== req.user.id) {
          return res.status(403).json({ error: "Not authorized to update this booking" });
        }
      }
    } else if (req.user.role === "customer") {
      // Customers can only cancel their own bookings
      if (booking.customer.toString() !== req.user.id || status !== "cancelled") {
        return res.status(403).json({ error: "Only providers can update booking status" });
      }
    } else {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    booking.status = status;
    
    // If marking as completed, add completion timestamp and update earnings
    if (status === "completed" && !booking.earningsAdded && req.user.role === "provider") {
      booking.completedAt = new Date();
      booking.earningsAdded = true;
      
      // Add earnings to provider
      const User = require("../models/User");
      const provider = await User.findById(req.user.id);
      const earnings = parseFloat(booking.amount) || 0;
      
      if (provider && earnings > 0) {
        // Initialize provider stats if they don't exist
        if (!provider.providerStats) {
          provider.providerStats = { 
            totalEarnings: 0, 
            completedBookings: 0, 
            totalReviews: 0, 
            averageRating: 0 
          };
        }
        provider.providerStats.totalEarnings += earnings;
        provider.providerStats.completedBookings += 1;
        await provider.save();
        
        console.log(`💰 Updated provider earnings: +${earnings}, Total: ${provider.providerStats.totalEarnings}`);
      }
    }
    
    await booking.save();
    
    console.log(`✅ Booking status updated successfully to: ${status}`);
    
    // Populate booking data for response
    const populatedBooking = await Booking.findById(bookingId)
      .populate("service")
      .populate("customer", "name email");
    
    res.json({ 
      success: true,
      message: "Booking status updated successfully", 
      booking: populatedBooking 
    });
  } catch (err) {
    console.error('❌ Error updating booking status:', err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Submit review for completed booking (customer only)
router.post("/:id/review", authMiddleware, async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ error: "Only customers can submit reviews" });
  }
  
  try {
    const bookingId = req.params.id;
    const { rating, comment } = req.body;
    
    console.log(`🌟 Submitting review for booking ${bookingId}:`, { rating, comment });
    
    // Validate rating
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be a number between 1 and 5" });
    }
    
    const numericRating = Number(rating);
    
    // Find booking and populate service
    const booking = await Booking.findById(bookingId).populate("service");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Check if customer owns this booking
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to review this booking" });
    }
    
    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Can only review completed bookings" });
    }
    
    // Check if already reviewed
    if (booking.review && booking.review.rating) {
      return res.status(400).json({ error: "Booking already reviewed" });
    }
    
    // Add review to booking
    booking.review = {
      rating: numericRating,
      comment: comment || "",
      reviewedAt: new Date()
    };
    
    await booking.save();
    console.log(`✅ Review saved to booking: ${numericRating} stars`);
    
    // Update provider's average rating
    if (booking.service && booking.service.provider) {
      try {
        const User = require("../models/User");
        const provider = await User.findById(booking.service.provider);
        
        if (provider) {
          // Initialize provider stats if they don't exist
          if (!provider.providerStats) {
            provider.providerStats = {
              totalEarnings: 0,
              completedBookings: 0,
              totalReviews: 0,
              averageRating: 0
            };
          }
          
          console.log(`👤 Provider stats before update:`, provider.providerStats);
          
          // Calculate new average rating
          const stats = provider.providerStats;
          const currentTotal = stats.averageRating * stats.totalReviews;
          stats.totalReviews += 1;
          stats.averageRating = (currentTotal + numericRating) / stats.totalReviews;
          
          // Round to 1 decimal place
          stats.averageRating = Math.round(stats.averageRating * 10) / 10;
          
          await provider.save();
          console.log(`🎯 Provider stats after update:`, provider.providerStats);
        } else {
          console.log(`❌ Provider not found for service ${booking.service._id}`);
        }
      } catch (providerError) {
        console.error(`❌ Error updating provider rating:`, providerError);
        // Don't fail the entire review submission if provider update fails
      }
    }
    
    // Populate booking for response
    const updatedBooking = await Booking.findById(bookingId)
      .populate("service")
      .populate("customer", "name email");
    
    res.json({ 
      success: true,
      message: "Review submitted successfully", 
      booking: updatedBooking 
    });
  } catch (err) {
    console.error('❌ Error submitting review:', err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Get bookings for provider by their services
router.get("/provider", authMiddleware, async (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ error: "Only providers can access this" });
  
  try {
    const Service = require("../models/Service");
    const providerServices = await Service.find({ provider: req.user.id });
    const serviceIds = providerServices.map(service => service._id);
    
    const bookings = await Booking.find({ 
      service: { $in: serviceIds }
    })
      .populate("service")
      .populate("customer", "name email phone")
      .sort({ date: -1 });
    
    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching provider bookings:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Cancel a booking
router.delete("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Check if user owns this booking or is the provider
    if (booking.customer.toString() !== req.user.id && req.user.role !== "provider") {
      return res.status(403).json({ error: "Not authorized to cancel this booking" });
    }
    
    // Update status to cancelled instead of deleting
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Debug endpoint to check provider earnings
router.get("/debug/earnings", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Only providers can access this" });
    }
    
    const Service = require("../models/Service");
    const User = require("../models/User");
    
    // Get provider info
    const provider = await User.findById(req.user.id);
    
    // Get all services for this provider
    const services = await Service.find({ provider: req.user.id });
    const serviceIds = services.map(s => s._id);
    
    // Get all bookings
    const allBookings = await Booking.find({
      service: { $in: serviceIds }
    }).populate('service', 'title price');
    
    // Get completed bookings
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    
    // Calculate earnings manually
    const earnings = completedBookings.map(b => ({
      id: b._id,
      service: b.service?.title || 'Unknown Service',
      servicePrice: b.service?.price || 'No Price',
      bookingAmount: b.amount,
      parsedAmount: parseFloat(b.amount) || 0,
      status: b.status,
      isValidAmount: !isNaN(parseFloat(b.amount)) && parseFloat(b.amount) > 0
    }));
    
    const totalEarnings = earnings.reduce((sum, e) => sum + e.parsedAmount, 0);
    
    console.log(`🔍 Debug earnings for provider ${provider.name}:`);
    console.log(`📊 Total services: ${services.length}`);
    console.log(`📋 Total bookings: ${allBookings.length}`);
    console.log(`✅ Completed bookings: ${completedBookings.length}`);
    console.log(`💰 Calculated earnings: ${totalEarnings}`);
    console.log(`📈 Current provider stats:`, provider.providerStats);
    
    res.json({
      success: true,
      provider: provider.name,
      servicesCount: services.length,
      totalBookings: allBookings.length,
      completedBookings: completedBookings.length,
      earnings,
      calculatedTotal: totalEarnings,
      currentStats: provider.providerStats || null
    });
  } catch (err) {
    console.error("Debug earnings error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;