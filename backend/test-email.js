// Test file for forgot password functionality
const nodemailer = require("nodemailer");

// Test email configuration
console.log("🧪 Testing email configuration...");

const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'test@gmail.com', 
      pass: process.env.EMAIL_PASS || 'test-password'    
    }
  });
};

// Test transporter creation
try {
  const transporter = createEmailTransporter();
  console.log("✅ Email transporter created successfully");
  
  // Test connection (optional)
  transporter.verify((error, success) => {
    if (error) {
      console.log("❌ Email configuration error:", error.message);
      console.log("💡 To fix this:");
      console.log("   1. Update EMAIL_USER and EMAIL_PASS in .env file");
      console.log("   2. For Gmail: Enable 2FA and generate an app password");
      console.log("   3. For other providers: Use correct SMTP credentials");
    } else {
      console.log("✅ Email server is ready to send emails");
    }
  });
  
} catch (error) {
  console.error("❌ Transporter creation failed:", error);
}

console.log("\n📝 Environment variables status:");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Not set");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set");
console.log("\n🚀 Forgot password API endpoints available:");
console.log("POST /api/auth/forgot-password - Send reset email");
console.log("POST /api/auth/reset-password/:token - Reset password with token");