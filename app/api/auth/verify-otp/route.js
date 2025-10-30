import dbConnect from "@/lib/dbConnect";
import ShopRegistrationRequest from "@/models/ShopRegistrationRequest";
import Shop from "@/models/Shop";
import ShopAdmin from "@/models/ShopAdmin";
import { NextResponse } from "next/server";

// Function to generate unique Shop ID
async function generateShopId() {
  let shopId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate SHOP001, SHOP002, etc.
    const count = await Shop.countDocuments();
    shopId = `SHOP${String(count + 1).padStart(3, '0')}`;
    
    const exists = await Shop.findOne({ shopId });
    if (!exists) {
      isUnique = true;
    }
  }
  
  return shopId;
}

// Function to generate unique Shop Code (alphanumeric)
async function generateShopCode() {
  let shopCode;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate random alphanumeric code like ABC, XYZ, etc.
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I, O to avoid confusion
    shopCode = '';
    for (let i = 0; i < 3; i++) {
      shopCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const exists = await Shop.findOne({ shopCode });
    if (!exists) {
      isUnique = true;
    }
  }
  
  return shopCode;
}

export async function POST(request) {
  await dbConnect();
  try {
    const { email, otp } = await request.json();

    console.log("OTP Verification Request:", { email, otp });

    // Find request by email - get the most recent pending one
    const requestRecord = await ShopRegistrationRequest.findOne({
      email,
      status: 'pending'
    }).sort({ createdAt: -1 });

    if (!requestRecord) {
      console.log("No pending registration found for:", email);
      return NextResponse.json({ message: "No pending registration found. Please register again." }, { status: 404 });
    }

    console.log("Found registration request:", {
      shopName: requestRecord.shopName,
      ownerName: requestRecord.ownerName,
      email: requestRecord.email,
      phone: requestRecord.phone ? 'Provided' : 'Missing',
      otp: requestRecord.otp,
      expires: requestRecord.otpExpires,
      expired: requestRecord.otpExpires < new Date()
    });

    // Check if OTP is correct
    if (requestRecord.otp !== otp) {
      console.log("Invalid OTP. Provided:", otp, "Expected:", requestRecord.otp);
      return NextResponse.json({ message: "Invalid OTP. Please check and try again." }, { status: 400 });
    }

    // Check if OTP has expired
    if (requestRecord.otpExpires < new Date()) {
      console.log("OTP expired. Expires:", requestRecord.otpExpires, "Now:", new Date());
      return NextResponse.json({ message: "OTP has expired. Please register again to get a new OTP." }, { status: 400 });
    }

    console.log("Proceeding with shop creation...");

    // Check if shop and admin already exist (prevent duplicates)
    const existingShop = await Shop.findOne({ name: requestRecord.shopName });
    let shop;
    let shopId;
    let shopCode;

    if (existingShop) {
      // Shop exists, use existing
      shop = existingShop;
      shopId = existingShop.shopId;
      shopCode = existingShop.shopCode;
      console.log("Existing shop found:", shopId);

      // Check if ShopAdmin already exists
      const existingAdmin = await ShopAdmin.findOne({ email: requestRecord.email, shopId: shop._id });
      if (existingAdmin) {
        console.log("Shop Admin already exists");
        return NextResponse.json({ 
          message: "Shop and Admin already exist.",
          success: true,
          shopId,
          shopCode
        });
      }
    } else {
      // Generate unique Shop ID and Shop Code for new shop
      console.log("Generating new shop ID and Code...");
      shopId = await generateShopId();
      shopCode = await generateShopCode();
      console.log("Generated:", shopId, shopCode);

      // Create Shop
      shop = await Shop.create({
        shopId,
        shopCode,
        name: requestRecord.shopName,
        address: requestRecord.address,
        city: requestRecord.city,
        state: requestRecord.state,
      });
      console.log("Shop created successfully");
    }

    // Create ShopAdmin
    // Validate required fields
    if (!requestRecord.phone) {
      throw new Error("Phone number is missing from registration data. Please register again with phone number.");
    }
    
    console.log("Creating Shop Admin...");
    await ShopAdmin.create({
      name: requestRecord.ownerName,
      email: requestRecord.email,
      phone: requestRecord.phone,
      password: requestRecord.password,
      shopId: shop._id,
    });
    console.log("Shop Admin created successfully");

    // Update the request record
    console.log("Updating registration request status...");
    requestRecord.status = 'approved';
    requestRecord.otp = undefined;
    requestRecord.otpExpires = undefined;
    requestRecord.shopId = shopId;
    requestRecord.shopCode = shopCode;
    await requestRecord.save();
    console.log("Request updated to approved");

    console.log("✅ OTP verification complete!");

    return NextResponse.json({
      message: "Email verified successfully! Your shop has been registered.",
      success: true,
      shopId,
      shopCode,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      message: error.message || "An error occurred during verification.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}