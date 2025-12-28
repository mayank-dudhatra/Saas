import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Sale from '@/models/Sale';
import Item from '@/models/Item';
import Customer from '@/models/Customer';
import Shop from '@/models/Shop';

const getJwtSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    
    // --- SHOP ID FALLBACK ---
    let shopObjectId = payload.shopObjectId;
    if (!shopObjectId) {
      const shop = await Shop.findOne({ shopId: payload.shopId }).select('_id').lean();
      if (!shop) return NextResponse.json({ message: "Shop not found" }, { status: 404 });
      shopObjectId = shop._id;
    }

    const body = await request.json();

    // 1. Generate Invoice Number
    const count = await Sale.countDocuments({ shopId: shopObjectId });
    const billNumber = `INV-${2500 + count + 1}`;

    // 2. Create the Sale
    const newSale = new Sale({
      ...body,
      shopId: shopObjectId,
      billNumber,
    });

    // 3. Update Inventory (Atomic)
    const stockUpdates = body.items.map(item => ({
      updateOne: {
        filter: { _id: item.itemId, shopId: shopObjectId },
        update: { $inc: { stockQuantity: -item.quantity } }
      }
    }));
    
    if (stockUpdates.length > 0) {
      await Item.bulkWrite(stockUpdates);
    }

    // 4. Update Customer Balance if Credit
    if (body.paymentMode === 'Credit' && body.customerId) {
      await Customer.findOneAndUpdate(
        { _id: body.customerId, shopId: shopObjectId },
        { $inc: { balance: body.grandTotal } }
      );
    }

    await newSale.save();
    return NextResponse.json({ success: true, sale: newSale }, { status: 201 });

  } catch (error) {
    console.error("SALE API ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}