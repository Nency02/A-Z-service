// Load environment variables
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

// Add error handling for route imports
let authRoutes, serviceRoutes, bookingRoutes, employeeRoutes, adminRoutes, contactRoutes;

try {
  authRoutes = require("./routes/auth");
  console.log("✅ Auth routes loaded");
} catch (err) {
  console.error("❌ Auth routes failed:", err.message);
  process.exit(1);
}

try {
  serviceRoutes = require("./routes/service");
  console.log("✅ Service routes loaded");
} catch (err) {
  console.error("❌ Service routes failed:", err.message);
  process.exit(1);
}

try {
  bookingRoutes = require("./routes/booking");
  console.log("✅ Booking routes loaded");
} catch (err) {
  console.error("❌ Booking routes failed:", err.message);
  process.exit(1);
}

try {
  employeeRoutes = require("./routes/employee");
  console.log("✅ Employee routes loaded");
} catch (err) {
  console.error("❌ Employee routes failed:", err.message);
  process.exit(1);
}

try {
  adminRoutes = require("./routes/admin");
  console.log("✅ Admin routes loaded");
} catch (err) {
  console.error("❌ Admin routes failed:", err.message);
  process.exit(1);
}

try {
  contactRoutes = require("./routes/contact");
  console.log("✅ Contact routes loaded");
} catch (err) {
  console.error("❌ Contact routes failed:", err.message);
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directories if they don't exist
const fs = require('fs');
const uploadsServiceDir = path.join(__dirname, '../../uploads/services');
const uploadsEmployeeDir = path.join(__dirname, '../../uploads/employees');

if (!fs.existsSync(uploadsServiceDir)) {
  fs.mkdirSync(uploadsServiceDir, { recursive: true });
  console.log("✅ Created service uploads directory");
}
if (!fs.existsSync(uploadsEmployeeDir)) {
  fs.mkdirSync(uploadsEmployeeDir, { recursive: true });
  console.log("✅ Created employee uploads directory");
}

// Serve static files for images
app.use("/uploads/services", express.static(uploadsServiceDir));
app.use("/uploads/employees", express.static(uploadsEmployeeDir));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  console.error("Stack trace:", err.stack);
  
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

mongoose.connect("mongodb://localhost:27017/azservices").then(() => {
  console.log("✅ MongoDB connected");
  app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
    console.log("✅ Static files served from:");
    console.log("   - Services:", uploadsServiceDir);
    console.log("   - Employees:", uploadsEmployeeDir);
    console.log("📧 Email service:", process.env.EMAIL_USER ? "Configured" : "Not configured (check .env)");
  });
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
  console.log("💡 Please ensure MongoDB is running on localhost:27017");
  process.exit(1);
});