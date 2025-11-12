import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import Shop from '@/models/Shop';

const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

// Helper to verify admin and get their MongoDB Shop _id
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

// --- GET ALL ITEMS for the shop ---
export async function GET(request) {
  try {
    await dbConnect();
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
    const shopId = await verifyShopAdminAndGetShopId(); // This is the MongoDB _id
    
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.unit.baseUnit || !body.purchasePrice.amount || !body.salePrice.amount) {
      return NextResponse.json({ message: "Item Name, Base Unit, Purchase Price, and Sale Price are required." }, { status: 400 });
    }

    // Check if item name already exists in this shop
    const existingItem = await Item.findOne({ name: body.name, shopId });
    if (existingItem) {
      return NextResponse.json({ message: "An item with this name already exists." }, { status: 409 });
    }

    // Logic for stock conversion
    const conversionFactor = Number(body.unit.conversionFactor) || 1;
    // Check if a secondary unit is provided and valid
    const isSecondary = body.unit.secondaryUnit && conversionFactor > 0;
    
    const stockMultiplier = isSecondary ? conversionFactor : 1;
    
    // Convert opening stock and low stock to base units for storage
    const stockToSave = (Number(body.stockQuantity) || 0) * stockMultiplier;
    const lowStockToSave = (Number(body.lowStockAlertLevel) || 0) * stockMultiplier;

    const newItem = new Item({
      ...body,
      shopId,
      
      // Save the calculated base unit quantities
      stockQuantity: stockToSave,
      lowStockAlertLevel: lowStockToSave,
      
      'purchasePrice.amount': Number(body.purchasePrice.amount),
      'salePrice.amount': Number(body.salePrice.amount),
      'unit.conversionFactor': Number(body.unit.conversionFactor) || 1,
      
      // This is the fix: Saving the GST string
      gstSlab: body.gstSlab || 'GST@0%',

      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    });

    await newItem.save();
    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error("POST /api/shop/inventory Error:", error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}