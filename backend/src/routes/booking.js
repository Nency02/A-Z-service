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
      
      // Calculate earnings amount with better logic
      let earnings = 0;
      const bookingAmount = parseFloat(booking.amount);
      const servicePrice = parseFloat(booking.service?.price);
      
      if (!isNaN(bookingAmount) && bookingAmount > 0) {
        earnings = bookingAmount;
      } else if (booking.service && !isNaN(servicePrice) && servicePrice > 0) {
        earnings = servicePrice;
        // Update the booking amount if it was empty
        booking.amount = servicePrice.toString();
      }
      
      console.log(`💰 Earnings calculation for booking ${booking._id}:`);
      console.log(`   booking.amount: "${booking.amount}" → ${bookingAmount}`);
      console.log(`   service.price: "${booking.service?.price}" → ${servicePrice}`);
      console.log(`   final earnings: ${earnings}`);
      
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
      } else {
        console.log(`⚠️ No earnings added: provider=${!!provider}, earnings=${earnings}`);
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
          
          // Recalculate from all reviews instead of incrementing
          // Get all services for this provider
          const Service = require("../models/Service");
          const services = await Service.find({ provider: booking.service.provider });
          const serviceIds = services.map(s => s._id);
          
          // Get all completed bookings with reviews
          const allReviewedBookings = await Booking.find({
            service: { $in: serviceIds },
            status: 'completed',
            'review.rating': { $exists: true, $ne: null }
          });
          
          const totalReviews = allReviewedBookings.length;
          const totalRatingSum = allReviewedBookings.reduce((sum, b) => sum + (b.review.rating || 0), 0);
          const averageRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0;
          
          // Update stats with recalculated values
          provider.providerStats.totalReviews = totalReviews;
          provider.providerStats.averageRating = Math.round(averageRating * 10) / 10;
          
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

// Fix provider review count
router.post("/provider/fix-reviews", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Only providers can access this" });
    }
    
    const Service = require("../models/Service");
    const User = require("../models/User");
    
    // Get all services for this provider
    const services = await Service.find({ provider: req.user.id });
    const serviceIds = services.map(s => s._id);
    
    console.log(`🔧 Fixing review count for provider ${req.user.id}`);
    console.log(`📋 Found ${services.length} services`);
    
    // Get all bookings with reviews for provider's services
    const reviewedBookings = await Booking.find({
      service: { $in: serviceIds },
      status: 'completed',
      'review.rating': { $exists: true, $ne: null }
    }).populate('service', 'title price');
    
    console.log(`✅ Found ${reviewedBookings.length} bookings with reviews`);
    
    // Calculate correct review stats
    const totalReviews = reviewedBookings.length;
    const totalRatingSum = reviewedBookings.reduce((sum, booking) => {
      return sum + (booking.review.rating || 0);
    }, 0);
    const averageRating = totalReviews > 0 ? (totalRatingSum / totalReviews) : 0;
    
    console.log(`📊 Calculated stats:`);
    console.log(`   Total reviews: ${totalReviews}`);
    console.log(`   Total rating sum: ${totalRatingSum}`);
    console.log(`   Average rating: ${averageRating}`);
    
    // Update provider stats
    const provider = await User.findById(req.user.id);
    
    if (!provider.providerStats) {
      provider.providerStats = {
        totalEarnings: 0,
        completedBookings: 0,
        totalReviews: 0,
        averageRating: 0
      };
    }
    
    const oldReviews = provider.providerStats.totalReviews;
    const oldRating = provider.providerStats.averageRating;
    
    provider.providerStats.totalReviews = totalReviews;
    provider.providerStats.averageRating = Math.round(averageRating * 10) / 10;
    
    await provider.save();
    
    console.log(`✅ Updated review stats: ${oldReviews} → ${totalReviews} reviews, ${oldRating} → ${provider.providerStats.averageRating} rating`);
    
    res.json({
      success: true,
      message: "Review count fixed successfully",
      oldReviews,
      newReviews: totalReviews,
      oldRating,
      newRating: provider.providerStats.averageRating,
      reviewedBookings: reviewedBookings.map(b => ({
        bookingId: b._id,
        service: b.service?.title || 'Unknown',
        rating: b.review?.rating || 0,
        comment: b.review?.comment || ''
      }))
    });
    
  } catch (err) {
    console.error("Error fixing provider reviews:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get customer spending summary
router.get("/customer/spending", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Only customers can access this" });
    }
    
    // Get all completed bookings for this customer
    const completedBookings = await Booking.find({
      customer: req.user.id,
      status: 'completed'
    }).populate('service', 'title price');
    
    console.log(`📊 Found ${completedBookings.length} completed bookings for customer ${req.user.id}`);
    
    // Calculate total spending
    let totalSpent = 0;
    const spendingBreakdown = completedBookings.map(booking => {
      const bookingAmount = parseFloat(booking.amount) || 0;
      const servicePrice = parseFloat(booking.service?.price) || 0;
      const amount = bookingAmount > 0 ? bookingAmount : servicePrice;
      
      totalSpent += amount;
      
      return {
        bookingId: booking._id,
        service: booking.service?.title || booking.companyName || 'Unknown Service',
        amount: amount,
        date: booking.completedAt || booking.updatedAt,
        originalAmount: booking.amount,
        servicePrice: booking.service?.price
      };
    });
    
    console.log(`💰 Total spending calculated: ${totalSpent}`);
    
    res.json({
      success: true,
      totalSpent,
      completedBookings: completedBookings.length,
      spendingBreakdown
    });
    
  } catch (err) {
    console.error("Error fetching customer spending:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get provider earnings summary
router.get("/provider/earnings", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Only providers can access this" });
    }
    
    const Service = require("../models/Service");
    const User = require("../models/User");
    
    // Get all services for this provider
    const services = await Service.find({ provider: req.user.id });
    const serviceIds = services.map(s => s._id);
    
    // Get all completed bookings for provider's services
    const completedBookings = await Booking.find({
      service: { $in: serviceIds },
      status: 'completed'
    }).populate('service', 'title price');
    
    // Calculate total earnings from completed bookings
    let calculatedEarnings = 0;
    const earningsBreakdown = completedBookings.map(booking => {
      const bookingAmount = parseFloat(booking.amount) || 0;
      const servicePrice = parseFloat(booking.service?.price) || 0;
      const amount = bookingAmount > 0 ? bookingAmount : servicePrice;
      
      calculatedEarnings += amount;
      
      return {
        bookingId: booking._id,
        service: booking.service?.title || 'Unknown Service',
        amount: amount,
        date: booking.completedAt || booking.updatedAt,
        originalAmount: booking.amount,
        servicePrice: booking.service?.price
      };
    });
    
    // Get current provider stats from database
    const provider = await User.findById(req.user.id);
    const currentStats = provider.providerStats || { totalEarnings: 0 };
    
    // Update provider stats if they're incorrect
    if (Math.abs(currentStats.totalEarnings - calculatedEarnings) > 0.01) {
      console.log(`🔄 Updating provider earnings: ${currentStats.totalEarnings} → ${calculatedEarnings}`);
      
      if (!provider.providerStats) {
        provider.providerStats = {
          totalEarnings: 0,
          completedBookings: 0,
          totalReviews: 0,
          averageRating: 0
        };
      }
      
      provider.providerStats.totalEarnings = calculatedEarnings;
      provider.providerStats.completedBookings = completedBookings.length;
      await provider.save();
    }
    
    res.json({
      success: true,
      totalEarnings: calculatedEarnings,
      completedBookings: completedBookings.length,
      earningsBreakdown,
      servicesCount: services.length,
      wasUpdated: Math.abs(currentStats.totalEarnings - calculatedEarnings) > 0.01
    });
    
  } catch (err) {
    console.error("Error fetching provider earnings:", err);
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

// Process payment for completed service (customer only)
router.post("/:id/payment", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Only customers can process payments" });
    }
    
    const bookingId = req.params.id;
    const { paymentMethod, cardNumber, expiryDate, cvv, upiId, amount } = req.body;
    
    console.log(`💳 Processing payment for booking ${bookingId}:`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Payment method: ${paymentMethod}`);
    
    // Find the booking
    const booking = await Booking.findById(bookingId).populate("service");
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: "Booking not found" 
      });
    }
    
    // Check if customer owns this booking
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: "Not authorized to pay for this booking" 
      });
    }
    
    // Check if booking is completed and payment is pending
    if (booking.status !== "completed") {
      return res.status(400).json({ 
        success: false,
        error: "Can only pay for completed services" 
      });
    }
    
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ 
        success: false,
        error: "Payment already processed for this booking" 
      });
    }
    
    // Validate payment amount
    const bookingAmount = parseFloat(booking.amount) || 0;
    const servicePrice = parseFloat(booking.service?.price) || 0;
    const expectedAmount = bookingAmount > 0 ? bookingAmount : servicePrice;
    const paymentAmount = parseFloat(amount);
    
    if (Math.abs(paymentAmount - expectedAmount) > 0.01) {
      return res.status(400).json({ 
        success: false,
        error: "Payment amount doesn't match service cost",
        expected: expectedAmount,
        received: paymentAmount
      });
    }
    
    // Simulate payment processing (in real app, integrate with Stripe, PayPal, UPI, etc.)
    try {
      let paymentResult;
      
      if (paymentMethod === 'upi') {
        // UPI Payment validation
        if (!upiId || !upiId.includes('@') || upiId.length < 5) {
          return res.status(400).json({ 
            success: false,
            error: "Invalid UPI ID format" 
          });
        }
        
        // Simulate UPI payment processing
        console.log(`📱 Processing UPI payment to ${upiId}...`);
        
        // In a real application, you would integrate with UPI processors here:
        // - Razorpay UPI: razorpay.payments.create()
        // - Paytm UPI: paytm.initiateTransaction()
        // - PhonePe: phonepe.pay()
        
        paymentResult = {
          transactionId: `upi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: "success",
          amount: paymentAmount,
          currency: "INR",
          method: "upi",
          upiId: upiId,
          processedAt: new Date()
        };
      } else {
        // Card Payment validation
        if (!cardNumber || cardNumber.length < 13) {
          return res.status(400).json({ 
            success: false,
            error: "Invalid card number" 
          });
        }
        
        if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
          return res.status(400).json({ 
            success: false,
            error: "Invalid expiry date format (MM/YY)" 
          });
        }
        
        if (!cvv || cvv.length < 3) {
          return res.status(400).json({ 
            success: false,
            error: "Invalid CVV" 
          });
        }
        
        // Simulate card payment processing
        console.log(`💳 Processing ${paymentMethod} card payment...`);
        
        // In a real application, you would integrate with payment processors here:
        // - Stripe: stripe.charges.create()
        // - PayPal: paypal.payment.create()
        // - Square: square.payments.create()
        
        paymentResult = {
          transactionId: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: "success",
          amount: paymentAmount,
          currency: "INR",
          method: paymentMethod,
          processedAt: new Date()
        };
      }
      
      console.log(`✅ Payment processed:`, paymentResult);
      
      // Update booking with payment information
      booking.paymentStatus = "paid";
      booking.paymentDetails = {
        transactionId: paymentResult.transactionId,
        amount: paymentAmount,
        method: paymentMethod,
        processedAt: paymentResult.processedAt,
        lastFourDigits: paymentMethod === 'upi' ? null : cardNumber?.slice(-4),
        upiId: paymentMethod === 'upi' ? upiId : null
      };
      
      await booking.save();
      
      // Update customer's total spending
      const User = require("../models/User");
      const customer = await User.findById(req.user.id);
      
      if (customer) {
        if (!customer.customerStats) {
          customer.customerStats = { totalSpent: 0, completedBookings: 0 };
        }
        customer.customerStats.totalSpent += paymentAmount;
        await customer.save();
        
        console.log(`💰 Updated customer spending: +${paymentAmount}, Total: ${customer.customerStats.totalSpent}`);
      }
      
      // Populate booking for response
      const updatedBooking = await Booking.findById(bookingId)
        .populate({
          path: "service",
          populate: {
            path: "provider",
            select: "name email phone address username companyName"
          }
        })
        .populate("customer", "name email");
      
      res.json({
        success: true,
        message: "Payment processed successfully",
        payment: paymentResult,
        booking: updatedBooking
      });
      
    } catch (paymentError) {
      console.error(`❌ Payment processing failed:`, paymentError);
      res.status(500).json({ 
        success: false,
        error: "Payment processing failed",
        details: paymentError.message
      });
    }
    
  } catch (err) {
    console.error('❌ Error processing payment:', err);
    res.status(500).json({ 
      success: false,
      error: "Server error: " + err.message 
    });
  }
});

// Get customer's payment history
router.get("/customer/payments", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Only customers can access payment history" });
    }
    
    // Get all paid bookings for this customer
    const paidBookings = await Booking.find({
      customer: req.user.id,
      paymentStatus: "paid"
    })
      .populate("service", "title description")
      .sort({ "paymentDetails.processedAt": -1 });
    
    const payments = paidBookings.map(booking => ({
      id: booking._id,
      service: booking.service?.title || booking.companyName || "Unknown Service",
      amount: booking.paymentDetails?.amount || booking.amount,
      transactionId: booking.paymentDetails?.transactionId,
      method: booking.paymentDetails?.method,
      processedAt: booking.paymentDetails?.processedAt,
      lastFourDigits: booking.paymentDetails?.lastFourDigits,
      bookingDate: booking.preferredDate,
      status: "completed"
    }));
    
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    res.json({
      success: true,
      payments,
      totalPaid,
      paymentCount: payments.length
    });
    
  } catch (err) {
    console.error("Error fetching payment history:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;