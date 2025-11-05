import dbConnect from "@/lib/dbConnect";
import ShopAdmin from "@/models/ShopAdmin";
import Shop from "@/models/Shop";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  await dbConnect();

  try {
    const { email, phone, password } = await request.json();

    if (!password || (!email && !phone)) {
      return NextResponse.json(
        { message: "Email or Phone and password required." },
        { status: 400 }
      );
    }

    let shopAdmin;
    if (email) {
      console.log("Searching for Shop Admin with email:", email);
      shopAdmin = await ShopAdmin.findOne({ email }).populate('shopId');
      console.log("Found Shop Admin:", shopAdmin ? `${shopAdmin.name} - ${shopAdmin.email}` : "Not found");
    } else {
      console.log("Searching for Shop Admin with phone:", phone);
      shopAdmin = await ShopAdmin.findOne({ phone }).populate('shopId');
      console.log("Found Shop Admin:", shopAdmin ? `${shopAdmin.name} - ${shopAdmin.phone}` : "Not found");
    }

    if (!shopAdmin) {
      console.log("Shop Admin not found - returning 401");
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }
    
    // Block login if status is not 'approved'
    if (shopAdmin.status !== 'approved') {
        return NextResponse.json(
            { message: "Your shop registration is pending Super Admin approval. Please try again later." },
            { status: 403 }
        );
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, shopAdmin.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Create JWT payload with shopId in string format
    const payload = {
      id: shopAdmin._id.toString(),
      role: 'shopadmin',
      shopId: shopAdmin.shopId.shopId, // The shopId string like "SHOP001"
    };

    // --- 1. UPDATED THIS LINE ---
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    const response = NextResponse.json({
      message: "Login successful!",
      success: true,
      user: {
        id: shopAdmin._id,
        name: shopAdmin.name,
        email: shopAdmin.email,
        phone: shopAdmin.phone,
        shopId: shopAdmin.shopId.shopId,
        shopCode: shopAdmin.shopId.shopCode,
        shopName: shopAdmin.shopId.name,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      // --- 2. UPDATED THIS LINE ---
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Shop Admin Login Error:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}