import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { v2 as cloudinary } from 'cloudinary';

const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request) {
  // --- 1. Verify User is a Shop Admin ---
  try {
    // --- THIS IS THE FIX ---
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    // --- END FIX ---

    if (!token) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (payload.role !== 'shopadmin') {
      return NextResponse.json({ message: "Access denied." }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Authentication failed." }, { status: 401 });
  }

  // --- 2. Generate Signature for Cloudinary ---
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign = { timestamp };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    // --- 3. Send Signature and Public Data to Client ---
    return NextResponse.json({
      signature: signature,
      timestamp: timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });

  } catch (error) {
    console.error("Cloudinary signing error:", error);
    return NextResponse.json({ message: "Error generating upload signature." }, { status: 500 });
  }
}