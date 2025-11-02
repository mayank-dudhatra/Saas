import dbConnect from "@/lib/dbConnect";
import ShopAdmin from "@/models/ShopAdmin";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  await dbConnect();
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Find the shop admin
    const shopAdmin = await ShopAdmin.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordOtpExpires: { $gt: new Date() }, // Check if OTP is valid and not expired
    });

    if (!shopAdmin) {
      return NextResponse.json({ message: "Invalid or expired OTP. Please try again." }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    shopAdmin.password = hashedPassword;
    
    // Clear the OTP fields
    shopAdmin.resetPasswordOtp = undefined;
    shopAdmin.resetPasswordOtpExpires = undefined;
    
    await shopAdmin.save();

    return NextResponse.json({ 
      message: "Password has been reset successfully. You can now log in.",
      success: true 
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
