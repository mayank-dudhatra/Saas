# Setup Instructions for Agro SaaS Authentication

## ✅ Step 1: Environment Variables (COMPLETED)

The `.env.local` file has been created with the following structure:

```env
MONGODB_URI=mongodb://localhost:27017/agro-saas
JWT_SECRET=change_this_to_a_random_secret_key_min_32_characters
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password_here
EMAIL_FROM=noreply@example.com
```

### 🔧 What You Need to Configure:

#### 1. MongoDB Connection
- **Local MongoDB**: If you have MongoDB installed locally, use `mongodb://localhost:27017/agro-saas`
- **MongoDB Atlas** (Cloud): Get free cluster at https://www.mongodb.com/atlas
  - Connection string format: `mongodb+srv://username:password@cluster.mongodb.net/agro-saas`

#### 2. JWT Secret (IMPORTANT!)
Generate a strong random secret key:
- Online: https://randomkeygen.com/
- Terminal: `openssl rand -base64 32`
- Or use: `MySuperSecretJWTKeyForAgroSaaS_2024_!@#$%^&*()_RandomChars123456789`

**REPLACE** `change_this_to_a_random_secret_key_min_32_characters` with your generated secret.

#### 3. Email Configuration (For OTP)
To receive OTP emails during shop registration:

**Gmail Setup:**
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use your Gmail and App Password in `.env.local`

**Important:** Use the App Password (16 characters), NOT your regular Gmail password!

### 📝 Edit `.env.local` with your actual values

Open `.env.local` in your editor and replace the placeholder values.

---

## ✅ Step 2: Install Dependencies (COMPLETED)

Dependencies have been installed. Your `package.json` now includes:
- bcryptjs (password hashing)
- jsonwebtoken (JWT tokens)
- mongoose (MongoDB ORM)
- nodemailer (email sending)
- dotenv (environment variables)
- jose (token verification)

---

## 🎯 Step 3: Create Super Admin

### Option A: Using the CommonJS script (Recommended)

Run the script with pre-configured credentials:

```bash
node scripts/createSuperAdmin.cjs
```

This will create a Super Admin with:
- **Email**: `superadmin@agrosaas.com`
- **Password**: `SuperAdmin@123!`

### Option B: Edit and run with your own credentials

1. Open `scripts/createSuperAdmin.cjs`
2. Edit lines 24-25:
   ```javascript
   const SUPER_ADMIN_EMAIL = "your-email@example.com";
   const SUPER_ADMIN_PASSWORD = "YourSecurePassword123!";
   ```
3. Save and run:
   ```bash
   node scripts/createSuperAdmin.cjs
   ```

You should see:
```
✅ Database connected.
Creating Super Admin...
✅ Super Admin created successfully!
   Email: superadmin@agrosaas.com
   Password: SuperAdmin@123!
🚨 IMPORTANT: Save these credentials securely!
```

---

## 🚀 Step 4: Start the Development Server

```bash
npm run dev
```

The server will start at: **http://localhost:3000**

---

## 🧪 Step 5: Test the Authentication System

### Test Shop Admin Signup:

1. Visit: http://localhost:3000/signup
2. Fill in shop registration form:
   - Shop Name
   - Owner/Admin Name
   - Email
   - Phone
   - Password
   - Address, City, State (optional)
3. Click "Register"
4. **Check your email** for the OTP (6-digit code)
5. Visit: http://localhost:3000/verify-otp
6. Enter OTP and verify
7. **Note your Shop ID and Shop Code** displayed after verification

### Test Shop Admin Login:

1. Visit: http://localhost:3000/portal-access
2. Select **Shop Admin** tab
3. Choose Email or Phone login
4. Enter your credentials
5. You should be redirected to dashboard

### Test Customer Login:

1. First, create a customer via API (see below)
2. Visit: http://localhost:3000/portal-access
3. Select **Customer** tab
4. Enter:
   - Shop ID (e.g., SHOP001)
   - Phone number
   - Password
5. Login to customer dashboard

### Test Super Admin Login:

1. Visit: http://localhost:3000/portal-access
2. Select **Super Admin** tab
3. Enter credentials you created:
   - Email: `superadmin@agrosaas.com`
   - Password: `SuperAdmin@123!`
4. You should be redirected to super admin dashboard

---

## 📡 API Testing (Optional)

### Create a Customer (Requires Shop Admin Authentication)

Use Postman, curl, or any HTTP client:

```bash
# First, login as Shop Admin to get the token
# Then create customer with the token
curl -X POST http://localhost:3000/api/auth/customer/create \
  -H "Cookie: token=YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "address": "123 Main St",
    "password": "Customer123!"
  }'
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Ensure MongoDB is running locally, or
- Verify MongoDB Atlas connection string is correct
- Check `.env.local` has correct `MONGODB_URI`

### "JWT Secret key is not set"
- Add/update `JWT_SECRET` in `.env.local`
- Must be at least 32 characters long

### "OTP email not received"
- Check spam folder
- Verify email configuration in `.env.local`
- For Gmail, ensure you're using an App Password, not regular password
- Check email server credentials are correct

### "Port 3000 already in use"
- Stop other Next.js servers
- Or change port: `npm run dev -- -p 3001`

### Script errors (createSuperAdmin)
- Make sure MongoDB connection is working
- Verify `.env.local` exists and has correct values
- Try running with `node scripts/createSuperAdmin.cjs` (note `.cjs` extension)

---

## 📚 Additional Resources

- **MongoDB Atlas Setup**: https://www.mongodb.com/docs/atlas/getting-started/
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **JWT Documentation**: https://jwt.io/introduction
- **Next.js Documentation**: https://nextjs.org/docs

---

## ✅ Checklist

- [ ] Configured MongoDB URI in `.env.local`
- [ ] Generated and set JWT_SECRET
- [ ] Configured email settings (for OTP)
- [ ] Created Super Admin account
- [ ] Started development server
- [ ] Tested Shop Admin signup
- [ ] Tested Shop Admin login
- [ ] Tested Super Admin login

---

## 🎉 You're All Set!

Your authentication system is ready to use. All three roles (Super Admin, Shop Admin, Customer) are fully functional with:
- ✅ Secure password hashing
- ✅ JWT token authentication
- ✅ Shop-level isolation
- ✅ OTP verification
- ✅ Role-based access control

