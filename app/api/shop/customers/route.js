import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import Shop from '@/models/Shop';
import bcrypt from "bcryptjs";

// Utility to verify admin and get their MongoDB Shop _id
const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyShopAdminAndGetShopId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new Error("Authentication required.");

  const { payload } = await jwtVerify(token, getJwtSecretKey());
  if (payload.role !== 'shopadmin' || !payload.id) {
    throw new Error("Shop admin role required.");
  }
  
  // Find the Shop's MongoDB _id using the string shopId from the token
  const shop = await Shop.findOne({ shopId: payload.shopId }).lean();
  if (!shop) throw new Error("Shop not found.");
  
  return shop._id; // Return the MongoDB ObjectId
}

// --- GET ALL CUSTOMERS for the shop ---
export async function GET(request) {
  try {
    await dbConnect();
    const shopId = await verifyShopAdminAndGetShopId();

    // Find all customers linked to this shop's MongoDB _id
    const customers = await Customer.find({ shopId: shopId }).sort({ name: 1 });

    return NextResponse.json(customers);

  } catch (error) {
    console.error("GET /api/shop/customers Error:", error);
    return NextResponse.json({ message: error.message }, { status: error.message === "Authentication required." ? 401 : 500 });
  }
}

// --- CREATE A NEW CUSTOMER ---
export async function POST(request) {
  try {
    await dbConnect();
    const shopId = await verifyShopAdminAndGetShopId(); // This is the MongoDB _id
    
    // --- THIS LINE IS NOW FIXED ---
    const { name, phone, address, password } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ message: "Name and phone are required." }, { status: 400 });
    }

    // Check if customer already exists in this shop
    const existingCustomer = await Customer.findOne({ phone, shopId });
    if (existingCustomer) {
      return NextResponse.json({ message: "Customer with this phone number already exists." }, { status: 409 });
    }

    // Generate password if not provided by admin
    const customerPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(customerPassword, 12);

    const newCustomer = new Customer({
      name,
      phone,
      address: address || '',
      password: hashedPassword,
      shopId,
      balance: 0 // Default balance
    });

    await newCustomer.save();

    // Return the newly created customer (excluding password)
    const customerData = newCustomer.toObject();
    delete customerData.password;
    
    // Also send back the plain-text password for the admin to share
    customerData.initialPassword = customerPassword;

    return NextResponse.json(customerData, { status: 201 });

  } catch (error) {
    console.error("POST /api/shop/customers Error:", error);
    return NextResponse.json({ message: error.message }, { status: error.message === "Authentication required." ? 401 : 500 });
  }
}