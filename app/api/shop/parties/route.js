import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Party from '@/models/Party';
import Shop from '@/models/Shop';

// Utility to verify admin and get their MongoDB Shop _id
const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyShopAdminAndGetShopId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new Error("Authentication required.");

  const { payload } = await jwtVerify(token, getJwtSecretKey());
  if (payload.role !== 'shopadmin' || !payload.id) {
    throw new Error("Shop admin role required.");
  }
  
  const shop = await Shop.findOne({ shopId: payload.shopId }).lean();
  if (!shop) throw new Error("Shop not found.");
  
  return shop._id; // Return the MongoDB ObjectId
}

// --- GET ALL PARTIES for the shop ---
export async function GET(request) {
  try {
    await dbConnect();
    const shopId = await verifyShopAdminAndGetShopId();

    const parties = await Party.find({ shopId: shopId }).sort({ name: 1 });

    return NextResponse.json(parties);

  } catch (error) {
    console.error("GET /api/shop/parties Error:", error);
    return NextResponse.json({ message: error.message }, { status: error.message === "Authentication required." ? 401 : 500 });
  }
}

// --- CREATE A NEW PARTY ---
export async function POST(request) {
  try {
    await dbConnect();
    const shopId = await verifyShopAdminAndGetShopId(); // This is the MongoDB _id
    
    const { 
      name, 
      phone, 
      address, 
      email, 
      gstin, 
      gstType, 
      openingBalance 
    } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ message: "Party Name and Phone are required." }, { status: 400 });
    }

    // Check if party already exists in this shop
    const existingParty = await Party.findOne({ phone, shopId });
    if (existingParty) {
      return NextResponse.json({ message: "A party with this phone number already exists." }, { status: 409 });
    }
    
    // Check GSTIN uniqueness if provided
    if (gstin) {
      const existingGstin = await Party.findOne({ gstin, shopId });
      if (existingGstin) {
        return NextResponse.json({ message: "A party with this GSTIN already exists." }, { status: 409 });
      }
    }

    const newParty = new Party({
      name,
      phone,
      address: address || '',
      email: email || '',
      gstin: gstin || '',
      gstType: gstType || 'Unregistered',
      balance: parseFloat(openingBalance) || 0, // Set opening balance
      shopId,
    });

    await newParty.save();
    return NextResponse.json(newParty, { status: 201 });

  } catch (error) {
    console.error("POST /api/shop/parties Error:", error);
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}