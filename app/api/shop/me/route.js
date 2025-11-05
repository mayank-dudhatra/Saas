import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import ShopAdmin from '@/models/ShopAdmin';
import Shop from '@/models/Shop';
import { NextResponse } from 'next/server';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT Secret key is not set');
  return new TextEncoder().encode(secret);
};

// This ensures the route is re-evaluated by Next.js,
// but the underlying fetch() call (in the layout) can still be cached.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (payload.role !== 'shopadmin' || !payload.id) {
      return NextResponse.json({ message: "Invalid token payload." }, { status: 403 });
    }

    await dbConnect();
    
    // Find the admin by their ID and join the Shop data
    const shopAdmin = await ShopAdmin.findById(payload.id).populate('shopId').lean();
    
    if (!shopAdmin || !shopAdmin.shopId) {
      return NextResponse.json({ message: "Shop admin or associated shop not found." }, { status: 404 });
    }

    // This is the clean data object we will cache
    const shopData = {
      shopName: shopAdmin.shopId.name,
      shopIdString: shopAdmin.shopId.shopId,
      shopLogoUrl: shopAdmin.shopId.logoUrl,
      shopAdminName: shopAdmin.name,
    };

    return NextResponse.json(shopData);

  } catch (error) {
    console.error("Error in /api/shop/me:", error);
    return NextResponse.json(
      { message: "Authentication failed or server error." },
      { status: 401 }
    );
  }
}