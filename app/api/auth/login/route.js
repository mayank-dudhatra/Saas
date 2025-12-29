import dbConnect from "@/lib/dbConnect";
import SuperAdmin from "@/models/SuperAdmin";
import ShopAdmin from "@/models/ShopAdmin";
import Customer from "@/models/Customer";
import Shop from "@/models/Shop";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  await dbConnect();

  try {
    const { role, email, password, shopId, phone } = await request.json();

    if (!role) {
      return NextResponse.json({ message: "Role is required." }, { status: 400 });
    }

    let user;
    let isPasswordCorrect;

    switch (role) {
      case 'superadmin':
        if (!email || !password) return NextResponse.json({ message: "Email and password required." }, { status: 400 });
        user = await SuperAdmin.findOne({ email });
        if (user) isPasswordCorrect = await bcrypt.compare(password, user.password);
        break;

      case 'shopadmin':
        if (!email || !password) return NextResponse.json({ message: "Email and password required." }, { status: 400 });
        // Only allow approved admins to log in
        user = await ShopAdmin.findOne({ email, status: 'approved' });
        if (user) isPasswordCorrect = await bcrypt.compare(password, user.password);
        break;

      case 'customer':
        if (!shopId || !phone || !password) return NextResponse.json({ message: "Shop ID, Phone, and Password required." }, { status: 400 });
        user = await Customer.findOne({ shopId, phone });
        if (user) isPasswordCorrect = await bcrypt.compare(password, user.password);
        break;

      default:
        return NextResponse.json({ message: "Invalid role specified." }, { status: 400 });
    }

    if (!user || !isPasswordCorrect) {
      return NextResponse.json({ message: "Invalid credentials or account pending approval." }, { status: 401 });
    }

    // Create JWT Payload
    const payload = {
      id: user._id.toString(),
      role: role,
    };
    
    // Add shop context for Shop Admins and Customers
    if (role === 'shopadmin' || role === 'customer') {
      const shop = await Shop.findById(user.shopId).lean();
      if (shop) {
        payload.shopId = shop.shopId; // The custom ID (e.g., SHOP001)
        payload.shopObjectId = shop._id.toString(); // The MongoDB ObjectId [FIX]
      }
    }
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    const response = NextResponse.json({ message: "Login successful!", success: true });
   response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // CHANGED FROM 'strict' TO 'lax'
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}