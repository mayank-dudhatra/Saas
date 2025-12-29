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
      return NextResponse.json({ message: "Email or Phone and password required." }, { status: 400 });
    }

    let shopAdmin;
    if (email) {
      shopAdmin = await ShopAdmin.findOne({ email }).populate('shopId');
    } else {
      shopAdmin = await ShopAdmin.findOne({ phone }).populate('shopId');
    }

    if (!shopAdmin) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }
    
    if (shopAdmin.status !== 'approved') {
        return NextResponse.json({ message: "Your shop registration is pending approval." }, { status: 403 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, shopAdmin.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const payload = {
      id: shopAdmin._id.toString(),
      role: 'shopadmin',
      shopId: shopAdmin.shopId.shopId,
      shopObjectId: shopAdmin.shopId._id.toString(), 
    };

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
        shopName: shopAdmin.shopId.name,
      },
    });

    // --- FIX: Changed 'strict' to 'lax' to prevent redirect issues ---
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}