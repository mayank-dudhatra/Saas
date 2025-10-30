import dbConnect from "@/lib/dbConnect";
import ShopRegistrationRequest from "@/models/ShopRegistrationRequest";
import ShopAdmin from "@/models/ShopAdmin";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";

export async function POST(request) {
  await dbConnect();
  try {
    const { shopName, ownerName, email, phone, password, address, city, state } = await request.json();

    // Validate required fields
    if (!shopName || !ownerName || !email || !phone || !password) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await ShopAdmin.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log("Registration OTP:", { email, otp, expiresAt: otpExpires });

    // Upsert the request: create new or update existing pending request for this email
    const requestRecord = await ShopRegistrationRequest.findOneAndUpdate(
      { email, status: 'pending' },
      { shopName, ownerName, email, phone, password: hashedPassword, address, city, state, otp, otpExpires, status: 'pending' },
      { upsert: true, new: true }
    );

    console.log("Registration request saved:", requestRecord._id);

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: "Verify Your Email Address - Agro SaaS",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Email Verification</h2>
            <p>Thank you for registering your shop with Agro SaaS!</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 10px; font-weight: bold; color: #4CAF50; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666;">This OTP is valid for 10 minutes.</p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log("OTP email sent successfully to:", email);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Still return success so user can see the OTP in console for development
      console.log("⚠️  EMAIL SEND FAILED - OTP for development:", otp);
    }

    return NextResponse.json({ 
      message: "OTP sent to your email address. Please check your email and verify.", 
      success: true,
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    }, { status: 201 });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "An error occurred during registration." }, { status: 500 });
  }
}