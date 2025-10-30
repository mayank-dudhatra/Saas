import dbConnect from "@/lib/dbConnect";
import Shop from "@/models/Shop";
import { NextResponse } from "next/server";
import { jwtVerify } from 'jose';

// Utility to verify Super Admin token
const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request) {
  await dbConnect();

  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());

    // Security check: Only Super Admins can access this endpoint
    if (payload.role !== 'superadmin') {
      return NextResponse.json({ message: "Access denied. Super Admin required." }, { status: 403 });
    }

    // Fetch only shops with status 'pending' (pending Super Admin approval)
    const pendingShops = await Shop.find({ status: 'pending' }).sort({ createdAt: 1 });

    return NextResponse.json(pendingShops);

  } catch (error) {
    console.error("Super Admin Fetch Pending Shops Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending shops. Token verification failed." },
      { status: 401 }
    );
  }
}
