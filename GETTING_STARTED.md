# Getting Started - Quick Setup Guide

## ✅ What's Been Completed

1. ✅ `.env.local` file created
2. ✅ Dependencies installed (including dotenv)
3. ✅ CommonJS script created for Super Admin (`createSuperAdmin.cjs`)

## 🚀 Next Steps (Do These Now)

### 1. Configure Environment Variables

**Open `.env.local` and update these values:**

```env
# MongoDB - Choose ONE option:

# Option A: Local MongoDB (if installed)
MONGODB_URI=mongodb://localhost:27017/agro-saas

# Option B: MongoDB Atlas (Cloud - Recommended for testing)
# Get free cluster: https://www.mongodb.com/atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agro-saas

# JWT Secret - Generate a random string (REQUIRED!)
# Use: https://randomkeygen.com/ or openssl rand -base64 32
JWT_SECRET=YourRandomSecretKeyHere123456789!@#$%^&*

# Email Settings (For OTP emails)
# Gmail example - use App Password from: https://myaccount.google.com/apppasswords
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your_16_char_app_password
EMAIL_FROM=noreply@example.com
```

### 2. Create Super Admin

```bash
node scripts/createSuperAdmin.cjs
```

Default credentials will be:
- Email: `superadmin@agrosaas.com`
- Password: `SuperAdmin@123!`

*(You can edit the credentials in the script before running)*

### 3. Start the Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

### 4. Test Authentication

#### Test Shop Admin Registration:
1. Go to: http://localhost:3000/signup
2. Fill the form
3. Check email for OTP
4. Verify at: http://localhost:3000/verify-otp
5. Note your Shop ID!

#### Test Login:
1. Go to: http://localhost:3000/portal-access
2. Try all three login tabs:
   - **Shop Admin**: Email/Phone + Password
   - **Customer**: ShopID + Phone + Password
   - **Super Admin**: Email + Password

---

## 🎯 Quick MongoDB Setup (If needed)

### Option A: MongoDB Atlas (Free Cloud Database)
1. Sign up: https://www.mongodb.com/atlas
2. Create free cluster (M0)
3. Get connection string
4. Add to `.env.local`

### Option B: Local MongoDB
1. Download: https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Use: `mongodb://localhost:27017/agro-saas` in `.env.local`

---

## 📝 Quick Gmail App Password Setup (For OTP)

1. Go to: https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if not enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Create app password for "Mail"
5. Copy the 16-character password
6. Use it in `.env.local` for `EMAIL_SERVER_PASSWORD`

---

## 🆘 Having Issues?

See detailed troubleshooting in: **SETUP_INSTRUCTIONS.md**

Common issues:
- "Cannot connect to database" → Check MongoDB is running/connection string is correct
- "JWT Secret key is not set" → Add/update JWT_SECRET in `.env.local`
- "OTP email not received" → Check spam folder, verify email settings

---

## 📚 Full Documentation

- **SETUP_INSTRUCTIONS.md** - Detailed setup guide
- **AUTHENTICATION_README.md** - Complete API documentation
- **IMPLEMENTATION_SUMMARY.md** - What was implemented

---

## 🎉 Ready to Go!

Once you've:
1. ✅ Updated `.env.local` with real values
2. ✅ Created Super Admin
3. ✅ Started `npm run dev`

You can start testing the authentication system!

