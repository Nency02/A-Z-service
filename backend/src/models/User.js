// backend/src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxLength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  role: {
    type: String,
    enum: ["customer", "provider", "admin"],
    default: "customer"
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"]
  },
  address: {
    type: String,
    required: function() { return this.role !== "admin"; },
    trim: true,
    maxLength: [500, "Address cannot exceed 500 characters"]
  },
  city: {
    type: String,
    required: function() { return this.role !== "admin"; },
    trim: true
  },
  state: {
    type: String,
    default: "Gujarat",
    trim: true
  },
  pincode: {
    type: String,
    required: function() { return this.role !== "admin"; },
    match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
  },
  
  // Provider specific fields
  companyName: {
    type: String,
    required: function() { return this.role === "provider"; },
    trim: true,
    maxLength: [200, "Company name cannot exceed 200 characters"]
  },
  companyAddress: {
    type: String,
    required: function() { return this.role === "provider"; },
    trim: true,
    maxLength: [500, "Company address cannot exceed 500 characters"]
  },
  serviceProvided: {
    type: String,
    required: function() { return this.role === "provider"; },
    trim: true
  },
  businessRegistration: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // If GST number is provided, validate it
        if (v && v.length > 0) {
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        }
        return true; // Allow empty GST number
      },
      message: "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)"
    }
  },
  experience: {
    type: String,
    trim: true
  },
  
  // Provider statistics for ratings and earnings
  providerStats: {
    totalEarnings: { 
      type: Number, 
      default: 0 
    },
    completedBookings: { 
      type: Number, 
      default: 0 
    },
    totalReviews: { 
      type: Number, 
      default: 0 
    },
    averageRating: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 5 
    }
  },
  
  // Admin specific fields
  department: {
    type: String,
    required: function() { return this.role === "admin"; },
    trim: true
  },
  adminCode: {
    type: String,
    required: function() { return this.role === "admin"; },
    trim: true
  },
  
  // General fields
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: function() { return this.role !== "provider"; }
  },
  profileImage: {
    type: String
  },
  
  // Password reset fields
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ city: 1 });

// Method to calculate and update average rating
userSchema.methods.updateAverageRating = function(newRating) {
  const stats = this.providerStats;
  const currentTotal = stats.averageRating * stats.totalReviews;
  stats.totalReviews += 1;
  stats.averageRating = (currentTotal + newRating) / stats.totalReviews;
  return this.save();
};

// Method to initialize provider stats if they don't exist
userSchema.methods.initializeProviderStats = function() {
  if (!this.providerStats) {
    this.providerStats = {
      totalEarnings: 0,
      completedBookings: 0,
      totalReviews: 0,
      averageRating: 0
    };
  }
  return this;
};

module.exports = mongoose.model("User", userSchema);