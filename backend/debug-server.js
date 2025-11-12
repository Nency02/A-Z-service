// Quick server diagnostic script
const express = require("express");
const mongoose = require("mongoose");

console.log("🔍 A-Z Services Backend Diagnostic");
console.log("=====================================");

// Check Node version
console.log(`Node.js version: ${process.version}`);

// Check environment
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Test Express
try {
  const app = express();
  console.log("✅ Express.js loaded successfully");
} catch (err) {
  console.error("❌ Express.js error:", err.message);
}

// Test MongoDB connection
async function testMongoDB() {
  try {
    console.log("🔌 Testing MongoDB connection...");
    await mongoose.connect("mongodb://localhost:27017/azservices");
    console.log("✅ MongoDB connected successfully");
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);
    
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("💡 Solutions:");
    console.log("   - Ensure MongoDB is running (mongod service)");
    console.log("   - Check if port 27017 is available");
    console.log("   - Verify database name 'azservices'");
  }
}

// Test dotenv
try {
  require('dotenv').config();
  console.log("✅ dotenv loaded successfully");
  console.log(`📧 Email user configured: ${process.env.EMAIL_USER ? 'Yes' : 'No'}`);
} catch (err) {
  console.error("❌ dotenv error:", err.message);
}

// Test core dependencies
const dependencies = [
  'bcryptjs',
  'cors', 
  'jsonwebtoken',
  'nodemailer',
  'crypto',
  'multer'
];

dependencies.forEach(dep => {
  try {
    require(dep);
    console.log(`✅ ${dep} loaded`);
  } catch (err) {
    console.error(`❌ ${dep} failed:`, err.message);
  }
});

// Run MongoDB test
testMongoDB();

console.log("\n🚀 If all checks pass, try starting the server with:");
console.log("   npm run dev");
