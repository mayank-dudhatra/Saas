import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import Shop from "@/models/Shop";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Middleware to verify JWT and check if user is a shop admin
async function verifyShopAdmin(request) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'shopadmin') {
      return NextResponse.json(
        { message: "Only shop admins can create customers." },
        { status: 403 }
      );
    }

    return { userId: decoded.id, shopId: decoded.shopId };
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid or expired token." },
      { status: 401 }
    );
  }
}

export async function POST(request) {
  await dbConnect();

  try {
    // Verify the requester is a shop admin
    const authResult = await verifyShopAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { name, phone, address, password } = await request.json();

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { message: "Name and phone are required." },
        { status: 400 }
      );
    }

    // Find shop by shopId string
    const shop = await Shop.findOne({ shopId: authResult.shopId });

    if (!shop) {
      return NextResponse.json(
        { message: "Shop not found." },
        { status: 404 }
      );
    }

    // Check if customer already exists in this shop
    const existingCustomer = await Customer.findOne({
      phone,
      shopId: shop._id,
    });

    if (existingCustomer) {
      return NextResponse.json(
        { message: "Customer with this phone number already exists in your shop." },
        { status: 400 }
      );
    }

    // Generate password if not provided
    const customerPassword = password || Math.random().toString(36).slice(-8);

    // Hash password
    const hashedPassword = await bcrypt.hash(customerPassword, 12);

    // Create customer
    const customer = await Customer.create({
      name,
      phone,
      password: hashedPassword,
      address,
      shopId: shop._id,
    });

    // Return customer with plain password for initial sharing (only first time)
    return NextResponse.json({
      message: "Customer created successfully!",
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        password: customerPassword, // Return plain password only on creation
        shopId: shop.shopId,
        shopCode: shop.shopCode,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Customer Creation Error:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

