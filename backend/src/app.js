const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/service");
const bookingRoutes = require("./routes/booking");
const employeeRoutes = require("./routes/employee");

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

mongoose.connect("mongodb://localhost:27017/azservices", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("MongoDB connected");
  app.listen(5000, () => {
    console.log("Server running on port 5000");
    console.log("✅ Static files served from:");
    console.log("   - Services:", uploadsServiceDir);
    console.log("   - Employees:", uploadsEmployeeDir);
  });
}).catch(err => console.error(err));