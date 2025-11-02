import dbConnect from "@/lib/dbConnect";
import ShopAdmin from "@/models/ShopAdmin";
import { sendEmail } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("--- Forgot Password API Route Hit ---");
  await dbConnect();
  try {
    const { email } = await request.json();
    console.log(`[DEBUG] Received request for email: ${email}`);

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const shopAdmin = await ShopAdmin.findOne({ email });

    if (!shopAdmin) {
      // Security: We don't tell the user if the email was found or not.
      // But we log it for you (the developer) on the server.
      console.warn(`[DEBUG] ShopAdmin with email '${email}' NOT FOUND. No email will be sent.`);
      return NextResponse.json({ 
        message: "If an account with this email exists, a password reset OTP has been sent." 
      });
    }
    
    console.log(`[DEBUG] Found ShopAdmin: ${shopAdmin.name}. Generating OTP...`);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    console.log(`[DEBUG] Generated OTP: ${otp} for ${email}`);

    // Save OTP and expiry to the ShopAdmin document
    shopAdmin.resetPasswordOtp = otp;
    shopAdmin.resetPasswordOtpExpires = otpExpires;
    await shopAdmin.save();

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: "Your Password Reset Code - Agro SaaS",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Password Reset Request</h2>
            <p>We received a request to reset the password for your Agro SaaS Shop Admin account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 10px; font-weight: bold; color: #4CAF50; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666;">This OTP is valid for 10 minutes.</p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`[SUCCESS] Password reset OTP email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error("--- EMAIL SENDING FAILED ---");
      console.error(emailError);
      
      // Send a more specific error message back to the client
      return NextResponse.json({ 
        message: "Failed to send email. Please check server logs and .env.local configuration.",
        // Also send the OTP in dev mode so you can still test the flow
        ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "If an account with this email exists, a password reset OTP has been sent.",
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

