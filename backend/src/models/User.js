const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["customer", "provider"], default: "customer" },
  phone: { type: String },
  address: { type: String },
  
  // Provider-specific fields
  providerStats: {
    totalEarnings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  } 
});

module.exports = mongoose.model("User", userSchema);