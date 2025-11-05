import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import ShopAdmin from '@/models/ShopAdmin';
import Shop from '@/models/Shop'; 
import ShopAdminSidebar from "@/Components/ShopAdmin/sidebar"; 
import { redirect } from 'next/navigation';
import React from 'react';
// --- 1. Import your new Provider ---
import { ShopDataProvider } from './ShopDataContext';

export const dynamic = 'force-dynamic';

// Helper function to get JWT secret
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT Secret key is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
};

// Function to fetch Shop Admin data
async function getShopAdminData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (payload.role !== 'shopadmin' || !payload.id) return null;

    await dbConnect();
    const shopAdmin = await ShopAdmin.findById(payload.id).populate('shopId').lean();
    if (!shopAdmin || !shopAdmin.shopId) return null;
    
    // Log for debugging
    console.log("getShopAdminData (Layout) is fetching. Found logoUrl:", shopAdmin.shopId.logoUrl);
    
    return {
      shopName: shopAdmin.shopId.name,
      shopIdString: shopAdmin.shopId.shopId, 
      shopLogoUrl: shopAdmin.shopId.logoUrl,
      shopAdminName: shopAdmin.name,
    };
  } catch (error) {
    console.error("Error fetching shop admin data in layout:", error);
    return null;
  }
}

export default async function ShopLayout({ children }) {
  
  // 2. Fetch the data on the server
  const shopData = await getShopAdminData();

  if (!shopData) {
    redirect('/portal-access');
  }
  
  // 3. We no longer use React.cloneElement
  // We wrap the entire layout in the provider

  return (
    // 4. Pass the server-fetched data into the Provider
    <ShopDataProvider serverShopData={shopData}>
      <div className="flex bg-gray-50">
        
        {/* The Sidebar will now pull data from the context */}
        <ShopAdminSidebar />

        <main className="flex-1 h-screen overflow-y-auto">
          <div className="p-8">
            {children} 
          </div>
        </main>
      </div>
    </ShopDataProvider>
  );
}