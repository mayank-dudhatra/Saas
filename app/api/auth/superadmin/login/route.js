import dbConnect from "@/lib/dbConnect";
import SuperAdmin from "@/models/SuperAdmin";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  await dbConnect();

  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required." },
        { status: 400 }
      );
    }

    // Find super admin
    const superAdmin = await SuperAdmin.findOne({ email });

    if (!superAdmin) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, superAdmin.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Create JWT payload (no shopId for super admin)
    const payload = {
      id: superAdmin._id.toString(),
      role: 'superadmin',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    const response = NextResponse.json({
      message: "Login successful!",
      success: true,
      user: {
        id: superAdmin._id,
        email: superAdmin.email,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Super Admin Login Error:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

