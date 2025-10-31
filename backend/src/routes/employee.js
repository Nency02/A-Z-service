const express = require("express");
const multer = require("multer");
const path = require("path");
const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken");
const fs = require('fs');

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Create uploads directory
const uploadsDir = path.join(__dirname, '../../../uploads/employees');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created employee uploads directory");
}

// Auth middleware
function authProvider(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `employee-${timestamp}-${randomNum}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Add employee route
router.post("/add", authProvider, upload.single("image"), async (req, res) => {
  const { name, phone, email, address, age, experience, specialization, service } = req.body;

  // Validate required fields
  if (!name || !phone) {
    return res.status(400).json({ 
      error: "Name and phone are required"
    });
  }

  // Handle image upload
  let imageUrl = "";
  if (req.file) {
    imageUrl = `/uploads/employees/${req.file.filename}`;
    console.log("✅ Employee image saved:", imageUrl);
  }

  try {
    // Prepare employee data
    const employeeData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      address: address ? address.trim() : undefined,
      age: age ? parseInt(age) : undefined,
      experience: experience ? experience.trim() : undefined,
      specialization: specialization ? specialization.trim() : undefined,
      image: imageUrl,
      provider: req.user.id,
      service: service || undefined
    };

    // Create and save employee
    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();

    console.log("✅ Employee saved:", savedEmployee.name, "- Image:", savedEmployee.image || "No image");

    res.json({
      success: true,
      message: "Employee added successfully",
      employee: savedEmployee
    });

  } catch (dbError) {
    console.error("❌ Database error:", dbError);
    res.status(500).json({
      error: "Failed to save employee to database",
      details: dbError.message
    });
  }
});

// Get employees route
router.get("/my", authProvider, async (req, res) => {
  try {
    const employees = await Employee.find({ provider: req.user.id })
      .populate('service', 'title category')
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${employees.length} employees for provider ${req.user.id}`);

    res.json({ employees });
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

module.exports = router;