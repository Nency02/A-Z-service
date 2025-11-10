const express = require("express");
const Booking = require("../models/Booking");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Middleware to verify customer
function authCustomer(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}


// Book a service (customer only)
router.post("/book", authCustomer, async (req, res) => {
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
router.get("/my", authCustomer, async (req, res) => {
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
router.put("/:id/status", authCustomer, async (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ error: "Only providers can update booking status" });
  
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    
    if (!["pending", "confirmed", "in-progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const booking = await Booking.findById(bookingId).populate("service").populate("customer", "name email");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Check if provider owns this service
    if (booking.service && booking.service.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this booking" });
    }
    
    booking.status = status;
    
    // If marking as completed, add completion timestamp and update earnings
    if (status === "completed" && !booking.earningsAdded) {
      booking.completedAt = new Date();
      booking.earningsAdded = true;
      
      // Add earnings to provider
      const User = require("../models/User");
      const provider = await User.findById(req.user.id);
      const earnings = parseFloat(booking.amount) || parseFloat(booking.service?.price) || 0;
      
      if (provider && earnings > 0) {
        provider.providerStats.totalEarnings += earnings;
        provider.providerStats.completedBookings += 1;
        await provider.save();
      }
    }
    
    await booking.save();
    
    res.json({ message: "Booking status updated successfully", booking });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit review for completed booking (customer only)
router.post("/:id/review", authCustomer, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ error: "Only customers can submit reviews" });
  
  try {
    const bookingId = req.params.id;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    
    const booking = await Booking.findById(bookingId).populate("service");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to review this booking" });
    }
    
    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Can only review completed bookings" });
    }
    
    if (booking.review.rating) {
      return res.status(400).json({ error: "Booking already reviewed" });
    }
    
    // Add review to booking
    booking.review = {
      rating,
      comment: comment || "",
      reviewedAt: new Date()
    };
    
    await booking.save();
    
    // Update provider's average rating
    if (booking.service && booking.service.provider) {
      const User = require("../models/User");
      const provider = await User.findById(booking.service.provider);
      
      if (provider) {
        const oldTotal = provider.providerStats.averageRating * provider.providerStats.totalReviews;
        provider.providerStats.totalReviews += 1;
        provider.providerStats.averageRating = (oldTotal + rating) / provider.providerStats.totalReviews;
        await provider.save();
      }
    }
    
    res.json({ message: "Review submitted successfully", booking });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get bookings for provider by their services
router.get("/provider", authCustomer, async (req, res) => {
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
router.delete("/:id/cancel", authCustomer, async (req, res) => {
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

module.exports = router;