import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: "No token provided." },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({
      valid: true,
      user: {
        id: decoded.id,
        role: decoded.role,
        shopId: decoded.shopId || null,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { 
        valid: false,
        message: "Invalid or expired token." 
      },
      { status: 401 }
    );
  }
}

