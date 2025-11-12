# 🚨 A-Z Services - 500 Error Troubleshooting Guide

## Quick Fix Steps

### 1. **Check MongoDB Status**
```bash
# Windows - Check if MongoDB service is running
services.msc
# Look for "MongoDB" service and ensure it's "Running"

# Or start MongoDB manually:
mongod
```

### 2. **Restart Backend Server**
```bash
cd "C:\Users\admin\Desktop\5th sem\fswd\A-Z service\backend"
npm run dev
```

### 3. **Test Server Health**
```bash
# Run diagnostic script
node debug-server.js
```

## Common 500 Error Causes & Solutions

### ❌ **MongoDB Connection Failed**
**Symptoms:** Server won't start, connection timeout
**Solution:**
- Ensure MongoDB service is running
- Check if port 27017 is available
- Verify database name "azservices"

### ❌ **Environment Variables Missing**
**Symptoms:** Email-related errors
**Solution:**
- Check `.env` file exists in backend folder
- Add missing EMAIL_USER and EMAIL_PASS (optional)
- The app will work without email config now

### ❌ **Dependency Issues**
**Symptoms:** Module import errors
**Solution:**
```bash
# Reinstall dependencies
npm install
```

### ❌ **Route Import Errors**
**Symptoms:** Cannot find module errors
**Solution:**
- Check if all route files exist in `src/routes/`
- Verify file names match imports

## 🔧 **Enhanced Error Logging Added**

The backend now includes:
- ✅ Detailed startup logging
- ✅ Route loading verification  
- ✅ Global error handling
- ✅ 404 route detection
- ✅ MongoDB connection status
- ✅ Email configuration status

## 📊 **Check Console Output**

When starting the server, you should see:
```
✅ Auth routes loaded
✅ Service routes loaded  
✅ Booking routes loaded
✅ Employee routes loaded
✅ Admin routes loaded
✅ Contact routes loaded
✅ MongoDB connected
🚀 Server running on port 5000
📧 Email service: Configured/Not configured
```

## 🚀 **Start Server (Debug Mode)**

1. **Navigate to backend:**
   ```bash
   cd "C:\Users\admin\Desktop\5th sem\fswd\A-Z service\backend"
   ```

2. **Run diagnostic:**
   ```bash
   node debug-server.js
   ```

3. **Start server:**
   ```bash
   npm run dev
   ```

## 📱 **If Frontend Shows 500 Error**

Check browser Network tab:
- Which specific API endpoint is failing?
- What's the request payload?
- Check backend console for detailed error logs

## 🆘 **Still Having Issues?**

The enhanced error handling will now show:
- Exact error location
- Stack trace (in development)
- Timestamp and request path
- Specific module that failed to load

**Check the backend console for detailed error messages!**