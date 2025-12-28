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
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

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

  // --- 2. Perform the Actual Upload ---
  try {
    const { file } = await request.json();

    if (!file) {
      return NextResponse.json({ message: "No file data provided." }, { status: 400 });
    }

    // Upload the base64 image directly to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: 'bills', // Optional: saves all bills in a specific folder
      resource_type: 'image'
    });

    // --- 3. Return the secure URL to the frontend ---
    return NextResponse.json({
      success: true,
      secure_url: uploadResponse.secure_url,
      url: uploadResponse.url
    });

  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ 
      message: "Error uploading image to Cloudinary.",
      error: error.message 
    }, { status: 500 });
  }
}