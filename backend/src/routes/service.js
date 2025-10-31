const express = require("express");
const multer = require("multer");
const path = require("path");
const Service = require("../models/Service");
const Employee = require("../models/Employee"); // Add this import
const jwt = require("jsonwebtoken");
const fs = require('fs');

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Create uploads directory
const uploadsDir = path.join(__dirname, '../../../uploads/services');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created service uploads directory");
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

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `service-${timestamp}-${randomNum}${extension}`;
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

// Add service route
router.post("/add", authProvider, upload.single("image"), async (req, res) => {
  const { title, description, category, price, location } = req.body;

  if (!title || !description || !category || !price || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }

  let imageUrl = "";
  if (req.file) {
    imageUrl = `/uploads/services/${req.file.filename}`;
    console.log("✅ Service image saved:", imageUrl);
  }

  try {
    const serviceData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      price: parseFloat(price),
      location: location.trim(),
      image: imageUrl,
      provider: req.user.id
    };

    const service = new Service(serviceData);
    const savedService = await service.save();

    console.log("✅ Service saved:", savedService.title);

    res.json({
      success: true,
      message: "Service added successfully",
      service: savedService
    });

  } catch (dbError) {
    console.error("❌ Database error:", dbError);
    res.status(500).json({
      error: "Failed to save service to database",
      details: dbError.message
    });
  }
});

// Get services route
router.get("/my", authProvider, async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user.id })
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${services.length} services for provider ${req.user.id}`);

    res.json({ services });
  } catch (err) {
    console.error("❌ Error fetching services:", err);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Delete service route
router.delete("/delete/:id", authProvider, async (req, res) => {
  try {
    const serviceId = req.params.id;
    console.log(`🗑️ Delete request for service: ${serviceId} by provider: ${req.user.id}`);

    // Find the service and verify ownership
    const service = await Service.findOne({ 
      _id: serviceId, 
      provider: req.user.id 
    });

    if (!service) {
      return res.status(404).json({ 
        error: "Service not found or you don't have permission to delete it" 
      });
    }

    console.log(`🔍 Found service to delete: ${service.title}`);

    // Delete associated employees first
    const deletedEmployees = await Employee.deleteMany({ service: serviceId });
    console.log(`🗑️ Deleted ${deletedEmployees.deletedCount} associated employees`);

    // Delete employee images if they exist
    if (deletedEmployees.deletedCount > 0) {
      try {
        const employeesWithImages = await Employee.find({ 
          service: serviceId, 
          image: { $exists: true, $ne: "" } 
        });
        
        for (const employee of employeesWithImages) {
          if (employee.image) {
            const employeeImagePath = path.join(__dirname, '../../../uploads/employees', path.basename(employee.image));
            if (fs.existsSync(employeeImagePath)) {
              fs.unlinkSync(employeeImagePath);
              console.log(`🗑️ Deleted employee image: ${employeeImagePath}`);
            }
          }
        }
      } catch (imageError) {
        console.error("⚠️ Error deleting employee images:", imageError);
      }
    }

    // Delete service image file if it exists
    if (service.image) {
      const imagePath = path.join(__dirname, '../../../uploads/services', path.basename(service.image));
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`🗑️ Deleted service image: ${imagePath}`);
        }
      } catch (fileError) {
        console.error("❌ Error deleting service image:", fileError);
      }
    }

    // Delete the service
    await Service.findByIdAndDelete(serviceId);
    console.log(`✅ Service deleted: ${service.title}`);

    res.json({ 
      success: true, 
      message: "Service and associated employees deleted successfully",
      deletedEmployees: deletedEmployees.deletedCount
    });

  } catch (err) {
    console.error("❌ Error deleting service:", err);
    res.status(500).json({ 
      error: "Failed to delete service", 
      details: err.message 
    });
  }
});

module.exports = router;