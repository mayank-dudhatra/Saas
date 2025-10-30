import dbConnect from "@/lib/dbConnect";
import ShopAdmin from "@/models/ShopAdmin";
import Shop from "@/models/Shop";
import { NextResponse } from "next/server";
import { jwtVerify } from 'jose';
import { sendEmail } from "@/lib/mailer";

// Utility to verify Super Admin token
const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request) {
  await dbConnect();

  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());

    if (payload.role !== 'superadmin') {
      return NextResponse.json({ message: "Access denied. Super Admin required." }, { status: 403 });
    }

    const { shopId } = await request.json();

    if (!shopId) {
      return NextResponse.json({ message: "Shop ID is required." }, { status: 400 });
    }

    // 1. Find and update the Shop status
    const shop = await Shop.findOneAndUpdate(
      { shopId: shopId, status: 'pending' },
      { status: 'approved' },
      { new: true }
    );

    if (!shop) {
      return NextResponse.json({ message: `Shop with ID ${shopId} not found or already approved/rejected.` }, { status: 404 });
    }

    // 2. Find and update the primary ShopAdmin status
    const shopAdmin = await ShopAdmin.findOneAndUpdate(
      { shopId: shop._id, status: 'pending' },
      { status: 'approved' },
      { new: true }
    );

    // 3. Send approval email
    if (shopAdmin) {
      await sendEmail({
        to: shopAdmin.email,
        subject: `Your Shop ${shop.name} is Approved!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">🎉 Congratulations! Your Shop is Approved!</h2>
            <p>Dear ${shopAdmin.name},</p>
            <p>Your shop registration for <strong>${shop.name}</strong> has been reviewed and approved by our Super Admin.</p>
            <p>You can now log in and start using the Agro SaaS platform.</p>
            <p>Your Shop ID (for customer login): <strong>${shop.shopId}</strong></p>
            <p>Log in here: <a href="http://localhost:3000/portal-access" style="color: #4CAF50; text-decoration: none; font-weight: bold;">Go to Login Portal</a></p>
            <p style="margin-top: 30px;">Thank you for joining the platform!</p>
          </div>
        `,
      });
      console.log(`Approval email sent to ${shopAdmin.email}`);
    }

    return NextResponse.json({ 
        message: `Shop ${shopId} approved successfully. Admin notified.`,
        success: true 
    });

  } catch (error) {
    console.error("Super Admin Approval Error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred during approval." },
      { status: 500 }
    );
  }
}
