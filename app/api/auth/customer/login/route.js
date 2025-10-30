import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import Shop from "@/models/Shop";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  await dbConnect();

  try {
    const { shopId, phone, password } = await request.json();

    // Validate input
    if (!shopId || !phone || !password) {
      return NextResponse.json(
        { message: "Shop ID, Phone, and Password are required." },
        { status: 400 }
      );
    }

    // Find shop by shopId string
    const shop = await Shop.findOne({ shopId });

    if (!shop) {
      return NextResponse.json(
        { message: "Invalid Shop ID." },
        { status: 404 }
      );
    }

    // Find customer by phone and shopId (MongoDB ObjectId)
    const customer = await Customer.findOne({
      phone,
      shopId: shop._id,
    }).populate('shopId');

    if (!customer) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, customer.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Create JWT payload
    const payload = {
      id: customer._id.toString(),
      role: 'customer',
      shopId: shop.shopId, // The shopId string like "SHOP001"
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    const response = NextResponse.json({
      message: "Login successful!",
      success: true,
      user: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        shopId: shop.shopId,
        shopCode: shop.shopCode,
        shopName: shop.name,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Customer Login Error:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

