import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import Shop from '@/models/Shop';

const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

// Helper: Uses shopObjectId from payload to skip a DB query
async function verifyShopAdminAndGetShopId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new Error("Authentication required.");

  const { payload } = await jwtVerify(token, getJwtSecretKey());
  if (payload.role !== 'shopadmin' || !payload.id) {
    throw new Error("Shop admin role required.");
  }
  
  // Return the ObjectId from the token if available
  if (payload.shopObjectId) return payload.shopObjectId;

  // Fallback for older tokens
  const shop = await Shop.findOne({ shopId: payload.shopId }).select('_id').lean();
  if (!shop) throw new Error("Shop not found.");
  
  return shop._id;
}

// --- GET ALL ITEMS for the shop ---
export async function GET(request) {
  try {
    await dbConnect();
    // FIXED: Added "And" to match the function definition
    const shopId = await verifyShopAdminAndGetShopId();

    const items = await Item.find({ shopId: shopId }).sort({ name: 1 });

    return NextResponse.json(items);

  } catch (error) {
    console.error("GET /api/shop/inventory Error:", error);
    return NextResponse.json({ message: error.message }, { status: error.message === "Authentication required." ? 401 : 500 });
  }
}

// --- CREATE A NEW ITEM ---
export async function POST(request) {
  try {
    await dbConnect();
    const shopId = await verifyShopAdminAndGetShopId(); 
    
    const body = await request.json();

    if (!body.name || !body.unit.baseUnit || !body.purchasePrice.amount || !body.salePrice.amount) {
      return NextResponse.json({ message: "Required fields are missing." }, { status: 400 });
    }

    // Optimization: Removed manual duplicate check; enforced by DB unique index
    const conversionFactor = Number(body.unit.conversionFactor) || 1;
    const isSecondary = body.unit.secondaryUnit && conversionFactor > 0;
    const stockMultiplier = isSecondary ? conversionFactor : 1;
    
    const stockToSave = (Number(body.stockQuantity) || 0) * stockMultiplier;
    const lowStockToSave = (Number(body.lowStockAlertLevel) || 0) * stockMultiplier;

    const newItem = new Item({
      ...body,
      shopId,
      stockQuantity: stockToSave,
      lowStockAlertLevel: lowStockToSave,
      'purchasePrice.amount': Number(body.purchasePrice.amount),
      'salePrice.amount': Number(body.salePrice.amount),
      'unit.conversionFactor': Number(body.unit.conversionFactor) || 1,
      gstSlab: body.gstSlab || 'GST@0%',
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    });

    await newItem.save();
    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error("POST /api/shop/inventory Error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ message: "An item with this name already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}