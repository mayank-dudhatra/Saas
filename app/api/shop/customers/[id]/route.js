import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import Shop from '@/models/Shop';
import mongoose from 'mongoose';

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
  
  const shop = await Shop.findOne({ shopId: payload.shopId }).lean();
  if (!shop) throw new Error("Shop not found.");
  
  return shop._id; // Return the MongoDB ObjectId
}

// Helper to find and verify a customer
async function findAndVerifyCustomer(customerId, shopId) {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return null;
  }
  
  const customer = await Customer.findOne({
    _id: customerId,
    shopId: shopId, // Ensure customer belongs to the admin's shop
  });
  
  return customer;
}

// --- UPDATE A CUSTOMER ---
export async function PUT(request, { params }) {
  // --- THIS LINE IS NOW FIXED ---
  const { id } = params; // This is customerId
  
  try {
    await dbConnect();
    const shopId = await verifyShopAdminAndGetShopId();
    
    // --- THIS LINE IS NOW FIXED ---
    const { name, phone, address } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ message: "Name and phone are required." }, { status: 400 });
    }

    const customer = await findAndVerifyCustomer(id, shopId);
    if (!customer) {
      return NextResponse.json({ message: "Customer not found or access denied." }, { status: 404 });
    }

    // Check if phone number is being changed to one that already exists
    if (phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({ phone, shopId });
      if (existingCustomer) {
        return NextResponse.json({ message: "Another customer with this phone number already exists." }, { status: 409 });
      }
    }

    customer.name = name;
    customer.phone = phone;
    customer.address = address || '';
    
    await customer.save();

    const customerData = customer.toObject();
    delete customerData.password;

    return NextResponse.json(customerData);

  } catch (error) {
    console.error("PUT /api/shop/customers/[id] Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// --- DELETE A CUSTOMER ---
export async function DELETE(request, { params }) {
  // --- THIS LINE IS NOW FIXED ---
  const { id } = params; // This is customerId

  try {
    await dbConnect();
    const shopId = await verifyShopAdminAndGetShopId();

    const customer = await findAndVerifyCustomer(id, shopId);
    if (!customer) {
      return NextResponse.json({ message: "Customer not found or access denied." }, { status: 404 });
    }
    
    // Optional: Add safety check. Only allow deletion if balance is 0.
    // if (customer.balance !== 0) {
    //   return NextResponse.json({ message: "Cannot delete customer with an outstanding balance." }, { status: 400 });
    // }

    await Customer.deleteOne({ _id: id, shopId: shopId });

    return NextResponse.json({ message: "Customer deleted successfully." });

  } catch (error) {
    console.error("DELETE /api/shop/customers/[id] Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}