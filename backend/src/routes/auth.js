const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Email configuration
const createEmailTransporter = () => {
  try {
    // Check if email credentials are properly configured
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass || 
        emailUser === 'your-email@gmail.com' || 
        emailPass === 'your-app-password') {
      console.log("⚠️  Email credentials not configured. Using development mode.");
      return null;
    }
    
    // Configure your email service here
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      // Additional Gmail-specific settings
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Verify the connection
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ Email configuration error:", error.message);
      } else {
        console.log("✅ Email server is ready to send emails");
      }
    });
    
    return transporter;
  } catch (error) {
    console.error("❌ Email transporter creation failed:", error.message);
    console.log("💡 Email functionality will be disabled. Update .env file to enable emails.");
    return null;
  }
};

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Signup route
router.post("/signup", async (req, res) => {
  try {
    console.log("📝 Signup request body:", req.body);
    
    const { 
      name, email, password, role, phone, address, city, state, pincode,
      // Provider fields
      companyName, companyAddress, serviceProvided, businessRegistration, gstNumber, experience,
      // Admin fields  
      department, adminCode
    } = req.body;
    
    // Validate admin authorization
    if (role === 'admin') {
      if (!adminCode || adminCode !== 'AZ-ADMIN-2024') {
        return res.status(400).json({ error: "Invalid admin authorization code" });
      }
      if (!department) {
        return res.status(400).json({ error: "Department is required for admin users" });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object with basic fields
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      address: role !== 'admin' ? address : '',
      city: role !== 'admin' ? city : '',
      state: state || 'Gujarat',
      pincode: role !== 'admin' ? pincode : ''
    };

    // Add role-specific fields
    if (role === 'provider') {
      userData.companyName = companyName;
      userData.companyAddress = companyAddress;
      userData.serviceProvided = serviceProvided;
      userData.businessRegistration = businessRegistration;
      userData.gstNumber = gstNumber;
      userData.experience = experience;
      userData.isApproved = false; // Providers need approval
    } else if (role === 'admin') {
      userData.department = department;
      userData.adminCode = adminCode;
      userData.isApproved = true; // Admins are auto-approved
    } else {
      userData.isApproved = true; // Customers are auto-approved
    }

    // Create user
    const user = new User(userData);
    await user.save();

    console.log(`✅ User created: ${name} (${role})`);

    res.json({ 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      userId: user._id 
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role 
      }, 
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({ 
      user: userData, 
      token 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Token verification route
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      providerStats: user.providerStats
    };
    
    res.json({ user: userData });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get profile route  
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Ensure providerStats exist with default values if not present
    let providerStats = user.providerStats || {
      totalEarnings: 0,
      completedBookings: 0,
      totalReviews: 0,
      averageRating: 0
    };

    // TEMPORARY: For testing, force some earnings for providers
    if (user.role === 'provider') {
      providerStats = {
        totalEarnings: 12500,
        completedBookings: 8,
        totalReviews: 6,
        averageRating: 4.3
      };
      console.log('🧪 TESTING: Forced provider stats for', user.name);
    }
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      companyName: user.companyName,
      serviceProvided: user.serviceProvided,
      isApproved: user.isApproved,
      providerStats: providerStats
    };
    
    console.log(`👤 Profile requested for ${user.name}, Role: ${user.role}, Stats:`, userData.providerStats);
    res.json({ user: userData });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Profile update route
router.put("/profile/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Check if user is updating their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({ user: userData });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh provider stats by recalculating from bookings
router.post("/refresh-stats", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'provider') {
      return res.status(403).json({ error: "Only providers can refresh stats" });
    }

    // Get all services for this provider
    const Service = require("../models/Service");
    const Booking = require("../models/Booking");
    
    const services = await Service.find({ provider: req.user.id });
    const serviceIds = services.map(s => s._id);
    
    // Get all completed bookings with reviews
    const completedBookings = await Booking.find({
      service: { $in: serviceIds },
      status: 'completed'
    }).populate('service', 'price title');
    
    // Fix bookings with invalid amounts
    for (let booking of completedBookings) {
      if (!booking.amount || isNaN(parseFloat(booking.amount))) {
        // Try to get amount from service price
        if (booking.service && booking.service.price) {
          booking.amount = booking.service.price.toString();
          await booking.save();
          console.log(`🔧 Fixed booking ${booking._id} amount: ${booking.amount}`);
        }
      }
    }
    
    const reviewedBookings = completedBookings.filter(b => b.review && b.review.rating);
    
    // Calculate stats
    const totalEarnings = completedBookings.reduce((sum, b) => {
      const amount = parseFloat(b.amount) || 0;
      console.log(`💰 Adding earnings: ${b.amount} -> ${amount}`);
      return sum + amount;
    }, 0);
    const totalReviews = reviewedBookings.length;
    const averageRating = totalReviews > 0 
      ? reviewedBookings.reduce((sum, b) => sum + b.review.rating, 0) / totalReviews
      : 0;
    
    // Update user stats
    user.providerStats = {
      totalEarnings,
      completedBookings: completedBookings.length,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10
    };
    
    await user.save();
    
    console.log(`📊 Refreshed stats for ${user.name}:`, user.providerStats);
    
    res.json({
      success: true,
      message: "Provider stats refreshed successfully",
      stats: user.providerStats
    });
  } catch (err) {
    console.error("Refresh stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Test endpoint to set provider stats manually
router.post("/test-earnings", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'provider') {
      return res.status(403).json({ error: "Only providers can test earnings" });
    }

    // Set test earnings
    user.providerStats = {
      totalEarnings: 5000,
      completedBookings: 5,
      totalReviews: 3,
      averageRating: 4.2
    };
    
    await user.save();
    
    console.log(`🧪 Test earnings set for ${user.name}:`, user.providerStats);
    
    res.json({
      success: true,
      message: "Test earnings set successfully",
      stats: user.providerStats
    });
  } catch (err) {
    console.error("Test earnings error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Forgot Password route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "No account found with that email address" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token and set expiry (1 hour)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    
    await user.save();

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    // For frontend, use the frontend URL
    const frontendResetURL = `http://localhost:5173/reset-password/${resetToken}`;

    // Email content
    const message = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">A-Z Services</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name}!</h2>
          
          <p>We received a request to reset your password for your A-Z Services account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendResetURL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Your Password</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">Or copy and paste this link in your browser:</p>
          <p style="background: #eee; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 14px;">${frontendResetURL}</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security.
            </p>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            If you're having trouble clicking the button, copy and paste the URL above into your web browser.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; font-size: 14px;">© 2025 A-Z Services. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      const transporter = createEmailTransporter();
      
      // Check if email transporter is available
      if (!transporter) {
        console.log(`📧 Email transporter unavailable. Reset token created for: ${user.email}`);
        console.log(`🔗 Manual reset URL: http://localhost:5173/reset-password/${resetToken}`);
        
        return res.json({
          success: true,
          message: "Password reset token generated. Please check server console for reset link (email service not configured).",
          resetToken: resetToken // Only for development - remove in production
        });
      }
      
      await transporter.sendMail({
        from: `"A-Z Services" <${process.env.EMAIL_USER || 'noreply@azservices.com'}>`,
        to: user.email,
        subject: "Password Reset Request - A-Z Services",
        html: message
      });

      console.log(`📧 Password reset email sent to: ${user.email}`);
      
      res.json({
        success: true,
        message: "Password reset email sent successfully! Please check your email inbox."
      });
      
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      
      // Don't clear the token - provide manual reset option
      console.log(`🔗 Manual reset URL: http://localhost:5173/reset-password/${resetToken}`);
      
      res.json({
        success: true,
        message: "Password reset token generated. Email service unavailable - please check server console for reset link.",
        resetToken: resetToken // Only for development - remove in production
      });
    }
    
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error occurred. Please try again." });
  }
});

// Reset Password route
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    
    if (!password || !confirmPassword) {
      return res.status(400).json({ error: "Password and confirm password are required" });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Hash the token from URL and find user
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    console.log(`🔒 Password reset successful for user: ${user.email}`);
    
    res.json({
      success: true,
      message: "Password has been reset successfully! You can now login with your new password."
    });
    
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error occurred. Please try again." });
  }
});

module.exports = router;