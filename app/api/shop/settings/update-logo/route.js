import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Shop from '@/models/Shop';
import { revalidateTag } from 'next/cache'; // <-- 1. IMPORT THIS

export const dynamic = 'force-dynamic';

const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

// Re-usable function to verify admin and get their Shop's *string* ID
async function verifyShopAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (payload.role !== 'shopadmin' || !payload.shopId) {
      return null;
    }
    return payload.shopId; // Returns the string shopId, e.g., "SHOP001"
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  await dbConnect();
  
  try {
    const shopIdString = await verifyShopAdmin();
    if (!shopIdString) {
      console.log("API Error: Auth failed. No shopIdString.");
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { logoUrl } = await request.json();
    if (!logoUrl) {
      console.log("API Error: No logoUrl in request body.");
      return NextResponse.json({ message: "logoUrl is required." }, { status: 400 });
    }

    console.log(`API: Attempting to update Shop with shopId: "${shopIdString}"`);
    console.log(`API: Setting logoUrl to: "${logoUrl}"`);

    const updatedShop = await Shop.findOneAndUpdate(
      { shopId: shopIdString },
      { $set: { logoUrl: logoUrl } },
      { new: true } 
    );

    if (!updatedShop) {
      console.log("API Error: Shop.findOneAndUpdate did not find a matching shop.");
      return NextResponse.json({ message: "Shop not found." }, { status: 404 });
    }

    // --- 2. ADD THIS LINE ---
    // This instantly clears the 7-day cache for the 'shop-data' tag.
    revalidateTag('shop-data');
    // --- END OF CHANGE ---

    console.log("API Success: Shop updated and cache revalidated.", updatedShop);

    return NextResponse.json({ 
      message: "Logo updated successfully!", 
      success: true,
      shop: updatedShop 
    });

  } catch (error) {
    console.error("Update Logo Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}