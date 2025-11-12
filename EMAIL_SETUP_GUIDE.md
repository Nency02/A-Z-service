# 📧 Email Setup Guide for Password Reset

## 🚀 Quick Setup (Gmail - Recommended)

### **Step 1: Create/Use Gmail Account**
- Use your existing Gmail account or create a new one
- Recommended: Create a dedicated account like `azserviceshelp@gmail.com`

### **Step 2: Enable 2-Factor Authentication**
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification" 
3. Follow the setup process (add phone number)

### **Step 3: Generate App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select your device/computer
4. Click "Generate"
5. **Copy the 16-character password** (spaces don't matter)

### **Step 4: Update .env File**
Edit `backend/.env` file:
```env
EMAIL_USER=azserviceshelp@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```
*(Use your actual email and the 16-character app password)*

### **Step 5: Restart Backend Server**
```bash
cd "C:\Users\admin\Desktop\5th sem\fswd\A-Z service\backend"
npm run dev
```

You should see: `✅ Email server is ready to send emails`

## 📱 **Alternative Email Providers**

### **Outlook/Hotmail**
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### **Yahoo Mail**
```env
EMAIL_USER=your-email@yahoo.com  
EMAIL_PASS=your-app-password
```
*(Yahoo also requires app passwords)*

### **Custom SMTP**
For other email providers, update the transporter configuration in `auth.js`:
```javascript
const transporter = nodemailer.createTransporter({
  host: "your-smtp-host.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🧪 **Testing Email Functionality**

### **Test 1: Server Startup**
When you start the backend, you should see:
```
✅ Email server is ready to send emails
```

### **Test 2: Send Test Email**
1. Go to forgot password page: `http://localhost:5173/forgot-password`
2. Enter any registered user's email
3. Click "Send Reset Link"
4. Check the email inbox for the password reset email

### **Test 3: Check Backend Console**
You should see:
```
📧 Password reset email sent to: user@example.com
```

## 🔧 **Troubleshooting**

### **"Less secure app access" Error**
- Gmail has deprecated this. Use App Passwords instead (Step 3 above)

### **"Invalid credentials" Error**
- Double-check email and app password in .env
- Ensure 2FA is enabled
- Generate a new app password

### **"Connection timeout" Error**
- Check your internet connection
- Try a different email provider
- Verify firewall isn't blocking SMTP

### **Still showing "email service not configured"**
- Restart the backend server after updating .env
- Check for typos in EMAIL_USER and EMAIL_PASS
- Ensure no extra spaces in the .env file

## 📧 **Email Template Features**

The password reset emails include:
- ✅ Professional A-Z Services branding
- ✅ Secure reset link with 1-hour expiry
- ✅ Clear instructions for users
- ✅ Security notices and warnings
- ✅ Responsive design for all devices

## 🔒 **Security Features**

- ✅ **Secure Tokens**: Cryptographically secure reset tokens
- ✅ **Time Expiry**: Links expire after 1 hour
- ✅ **Single Use**: Tokens are cleared after password reset
- ✅ **Hash Protection**: Tokens are hashed before storage
- ✅ **Email Validation**: Verifies user account exists

## 🎯 **Production Considerations**

For production deployment:
- Use environment-specific .env files
- Consider dedicated email service (SendGrid, Mailgun, AWS SES)
- Remove development-only features (reset token in response)
- Set up proper email authentication (SPF, DKIM)

## 📞 **Need Help?**

If you're still having issues:
1. Check the backend console for specific error messages
2. Verify all steps above are completed correctly
3. Try using a different email provider
4. Consider using a dedicated email service for production

**Once configured, users will receive professional password reset emails instantly!**