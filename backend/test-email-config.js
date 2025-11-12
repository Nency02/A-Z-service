// Email configuration test script
require('dotenv').config();
const nodemailer = require("nodemailer");

console.log("🧪 Testing Email Configuration for A-Z Services");
console.log("================================================");

// Check environment variables
console.log("📧 Email Configuration:");
console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'SET (hidden)' : 'NOT SET'}`);

// Test email function
async function testEmail() {
  try {
    console.log("\n🔧 Creating email transporter...");
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      secure: false,
      requireTLS: true,
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log("✅ Transporter created successfully");

    // Verify connection
    console.log("🔌 Testing connection...");
    await transporter.verify();
    console.log("✅ Email server connection successful!");

    // Send test email (optional - uncomment to send)
    /*
    console.log("📤 Sending test email...");
    const testEmail = {
      from: `"A-Z Services Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "Test Email - A-Z Services Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">🧪 Test Email Successful!</h2>
          <p>This is a test email from your A-Z Services application.</p>
          <p><strong>✅ Email configuration is working correctly!</strong></p>
          <p>Password reset emails will now be sent successfully.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            This test was sent on ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };

    await transporter.sendMail(testEmail);
    console.log("✅ Test email sent successfully!");
    */

    console.log("\n🎉 Email configuration is ready!");
    console.log("💡 Users will now receive password reset emails");

  } catch (error) {
    console.error("\n❌ Email configuration failed:");
    console.error("Error:", error.message);
    
    console.log("\n💡 Troubleshooting steps:");
    
    if (error.message.includes("Invalid login")) {
      console.log("   1. ❌ Check your email and app password in .env");
      console.log("   2. ❌ Ensure 2-Factor Authentication is enabled");
      console.log("   3. ❌ Generate a new app password from Google");
    } else if (error.message.includes("Connection timeout")) {
      console.log("   1. ❌ Check your internet connection");
      console.log("   2. ❌ Verify firewall isn't blocking SMTP");
      console.log("   3. ❌ Try a different email provider");
    } else {
      console.log("   1. ❌ Double-check EMAIL_USER and EMAIL_PASS values");
      console.log("   2. ❌ Ensure .env file is in the backend directory");
      console.log("   3. ❌ Restart the server after changes");
    }
  }
}

// Check if email credentials are configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
    process.env.EMAIL_USER === 'your-email@gmail.com' ||
    process.env.EMAIL_PASS === 'your-app-password') {
  
  console.log("\n⚠️  Email credentials not configured!");
  console.log("\n📝 To set up email service:");
  console.log("1. Edit backend/.env file");
  console.log("2. Set EMAIL_USER to your Gmail address");
  console.log("3. Set EMAIL_PASS to your Gmail app password");
  console.log("4. See EMAIL_SETUP_GUIDE.md for detailed instructions");
  
} else {
  // Run the test
  testEmail();
}