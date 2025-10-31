const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["customer", "provider"], default: "customer" },
  phone: { type: String },      // <-- Add this line
  address: { type: String }, 
});

module.exports = mongoose.model("User", userSchema);