const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  // If this booking corresponds to an existing Service in DB, link it
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: false },
  // Reference to the customer (User)
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Optional freeform/company fields for requests created from the frontend
  companyName: { type: String },
  companyId: { type: String },
  userName: { type: String },
  userEmail: { type: String },
  userPhone: { type: String },
  preferredDate: { type: String },
  preferredTime: { type: String },
  details: { type: String },
  amount: { type: String },

  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
    default: "pending" 
  },
  
  // Review system fields
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    reviewedAt: { type: Date }
  },
  
  // Service completion tracking
  completedAt: { type: Date },
  earningsAdded: { type: Boolean, default: false },
  
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  paymentDetails: {
    transactionId: { type: String },
    amount: { type: Number },
    method: { type: String },
    processedAt: { type: Date },
    lastFourDigits: { type: String },
    upiId: { type: String }
  }
});

module.exports = mongoose.model("Booking", bookingSchema);