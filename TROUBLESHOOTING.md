# Troubleshooting Common Issues

## Issue: OTP Verification Error (500)

### Solution Applied:
The `/api/auth/verify-otp` endpoint has been improved with:

1. **Better Error Handling**: More detailed error messages in development mode
2. **Duplicate Prevention**: Checks if shop/admin already exist before creating
3. **Flexible Search**: Finds registration requests by email without requiring specific status

### What to do now:

1. **Restart your development server** (if running):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Try the signup flow again**:
   - Go to: http://localhost:3000/signup
   - Fill in all required fields (including phone)
   - Submit registration
   - Check your email for OTP
   - Go to verify-otp page
   - Enter the OTP

3. **If you still get an error**, check:
   - Browser console (F12) for error details
   - Terminal where `npm run dev` is running for server error logs
   - Make sure you filled ALL required fields (shopName, ownerName, email, phone, password)

---

## Issue: Email Not Received

### Possible Causes:
1. **Wrong email configuration** in `.env.local`
2. **Using regular password instead of App Password** for Gmail
3. **Email went to spam folder**

### Solutions:
- Verify email settings in `.env.local`:
  - For Gmail: Use App Password from https://myaccount.google.com/apppasswords
  - Not your regular Gmail password!
- Check spam folder
- Try with a different email provider

---

## Issue: Can't Login After Signup

### Check:
1. Did OTP verification complete successfully?
2. Are you using the correct login credentials?
3. Did you restart the server after creating Super Admin?

### Login Credentials:
- **Super Admin**: 
  - Email: `superadmin@agrosaas.com`
  - Password: `SuperAdmin@123!`

- **Shop Admin**: Use the email/password you registered with
- **Customer**: Requires ShopID + Phone + Password (created by Shop Admin)

---

## Issue: "No pending request found"

This means:
- You already verified this email, OR
- OTP expired (10 minutes), OR
- Database connection issue

### Solution:
1. Try registering with a different email
2. Make sure OTP is entered within 10 minutes of registration
3. Check MongoDB connection in `.env.local`

---

## Issue: "Cannot connect to database"

### MongoDB Not Running:
- **Local MongoDB**: Start MongoDB service
- **MongoDB Atlas**: Verify connection string in `.env.local`

### Connection String Format:
```
Local: mongodb://localhost:27017/agro-saas
Atlas: mongodb+srv://username:password@cluster.mongodb.net/agro-saas
```

---

## Still Having Issues?

1. Check the error message in browser console (F12)
2. Check server logs in terminal
3. Verify all environment variables are set correctly
4. Ensure MongoDB is accessible
5. Try clearing browser cookies and retry

