# Agro SaaS Authentication System

This document describes the complete authentication system for the Agro SaaS platform with three roles: Super Admin, Shop Admin, and Customer.

## 🎯 Roles Overview

| Role        | Created By        | Login Credentials              | Access Scope                                |
|-------------|-------------------|--------------------------------|---------------------------------------------|
| Super Admin | Manual (in DB)    | Email + Password               | Manage all shops and analytics              |
| Shop Admin  | Self-registration | Email/Phone + Password         | Manage only their own shop                  |
| Customer    | Shop Admin        | ShopID + Phone + Password      | View purchases, credit/debit, orders        |

## 📋 Authentication Endpoints

### 1. Shop Admin Signup & Login

#### Signup (Self-Registration)
- **Endpoint**: `POST /api/auth/register-shop`
- **Fields**: shopName, ownerName, email, phone, password, address (optional), city (optional), state (optional)
- **Process**:
  1. Save registration request with OTP
  2. Send OTP to email
  3. Verify OTP at `/verify-otp`
  4. System generates Shop ID (SHOP001, SHOP002...) and Shop Code (ABC, XYZ...)
  5. Creates Shop and ShopAdmin records

#### OTP Verification
- **Endpoint**: `POST /api/auth/verify-otp`
- **Fields**: email, otp
- **Returns**: shopId, shopCode

#### Login
- **Endpoint**: `POST /api/auth/shopadmin/login`
- **Credentials**: Email **OR** Phone + Password
- **Returns**: JWT token with user info including shopId

### 2. Customer Creation & Login

#### Create Customer (by Shop Admin)
- **Endpoint**: `POST /api/auth/customer/create`
- **Authentication**: Requires Shop Admin JWT token
- **Fields**: name, phone, address (optional), password (optional - auto-generated if not provided)
- **Returns**: Customer details with plain password for initial sharing

#### Customer Login
- **Endpoint**: `POST /api/auth/customer/login`
- **Credentials**: ShopID + Phone + Password
- **Returns**: JWT token with user info

### 3. Super Admin Login

- **Endpoint**: `POST /api/auth/superadmin/login`
- **Credentials**: Email + Password
- **Returns**: JWT token
- **Note**: Super Admin must be created manually in database

### 4. Token Verification

- **Endpoint**: `GET /api/auth/verify`
- **Returns**: Valid token info (id, role, shopId)

### 5. Logout

- **Endpoint**: `POST /api/auth/logout`
- **Action**: Clears the auth cookie

## 🔐 JWT Token Structure

All tokens contain:
```javascript
{
  "id": "USER_ID",
  "role": "superadmin | shopadmin | customer",
  "shopId": "SHOP001" // only for shopadmin & customer
}
```

## 🛡️ Middleware & Access Control

- **Middleware File**: `middleware.js`
- **Public Paths**: `/login`, `/signup`, `/portal-access`, `/verify-otp`, `/api/auth`
- **Protected Paths**:
  - `/superadmin/*` - Only Super Admin
  - `/dashboard/*` - Shop Admin or Customer

## 🗄️ Database Models

### Shop
- shopId (String, unique) - e.g., "SHOP001"
- shopCode (String, unique) - e.g., "ABC"
- name (String)
- address, city, state (String, optional)

### ShopAdmin
- name, email, phone, password
- shopId (ObjectId, ref: Shop)
- Index: { email: 1, shopId: 1 } (unique)
- Index: { phone: 1, shopId: 1 } (unique)

### Customer
- name, phone, password, address (optional)
- shopId (ObjectId, ref: Shop)
- Index: { phone: 1, shopId: 1 } (unique)

### SuperAdmin
- email, password
- Index: { email: 1 } (unique)

### ShopRegistrationRequest
- Temporary table for pending registrations
- Fields: shopName, ownerName, email, phone, password, address, city, state, otp, otpExpires, status

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Super Admin
Edit `scripts/createSuperAdmin.js` and set your credentials:
```javascript
const SUPER_ADMIN_EMAIL = "your-email@example.com";
const SUPER_ADMIN_PASSWORD = "your-strong-password";
```

Then run:
```bash
node scripts/createSuperAdmin.js
```

### 3. Environment Variables
Ensure `.env.local` contains:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@example.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@example.com
```

### 4. Run Development Server
```bash
npm run dev
```

## 🧪 Testing Authentication

### Shop Admin Signup Flow
1. Visit `/signup`
2. Fill in shop details
3. Receive OTP via email
4. Verify OTP at `/verify-otp`
5. Shop ID and Code generated
6. Can login at `/portal-access` (Shop Admin tab)

### Customer Creation Flow
1. Shop Admin logs in
2. Shop Admin creates customer via API or UI
3. Customer receives login credentials
4. Customer can login at `/portal-access` (Customer tab)

### Super Admin Flow
1. Super Admin logs in at `/portal-access` (Super Admin tab)
2. Access all shop data and analytics

## 📁 File Structure

```
app/
  (auth)/
    signup/page.jsx          - Shop registration form
    portal-access/page.jsx   - Multi-role login page
    verify-otp/page.jsx      - OTP verification page
  api/auth/
    register-shop/route.js   - Shop registration endpoint
    verify-otp/route.js      - OTP verification & shop creation
    shopadmin/login/route.js - Shop admin login
    customer/
      login/route.js         - Customer login
      create/route.js        - Customer creation (admin only)
    superadmin/login/route.js- Super admin login
    verify/route.js          - Token verification
    logout/route.js          - Logout

models/
  Shop.js                    - Shop model
  ShopAdmin.js               - Shop admin model
  Customer.js                - Customer model
  SuperAdmin.js              - Super admin model
  ShopRegistrationRequest.js - Registration requests

scripts/
  createSuperAdmin.js        - Script to create super admin

middleware.js                - Authentication middleware
```

## 🔒 Security Features

1. **Password Hashing**: All passwords hashed with bcrypt (12 rounds)
2. **JWT Tokens**: Secure tokens with httpOnly cookies
3. **Shop Isolation**: Customers only see their shop's data
4. **Indexes**: Prevent duplicate emails/phones within same shop
5. **OTP Expiry**: OTPs expire after 10 minutes
6. **Role-Based Access**: Middleware enforces role-based access control

## 📝 Notes

- Same customer name/phone can exist in different shops (shop-specific accounts)
- Each shop can have multiple Shop Admins
- Shop IDs are auto-generated sequentially (SHOP001, SHOP002...)
- Shop Codes are random 3-character codes (ABC, XYZ...)
- Passwords for customers can be auto-generated if not provided
- All timestamps automatically tracked in models

## 🐛 Troubleshooting

### OTP not received
- Check email server configuration
- Verify EMAIL_* environment variables
- Check spam folder

### Login fails
- Verify user exists in database
- Check JWT_SECRET is set
- Ensure MongoDB connection is active

### Middleware redirects
- Check token is being set correctly
- Verify role in JWT payload
- Ensure public paths are correctly configured

