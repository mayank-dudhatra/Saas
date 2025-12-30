import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import ShopAdminSidebar from "@/Components/ShopAdmin/sidebar"; 
import { redirect } from 'next/navigation';
import React from 'react';
import { ShopDataProvider } from './ShopDataContext';
import { Toaster } from 'react-hot-toast';
import dbConnect from '@/lib/dbConnect';
import ShopAdmin from '@/models/ShopAdmin';
import Shop from '@/models/Shop';

// Removed force-dynamic to allow Next.js to optimize the layout shell

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT Secret key is not set');
  return new TextEncoder().encode(secret);
};

// OPTIMIZED: Direct DB call instead of slow internal fetch()
async function getShopAdminData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    
    await dbConnect();
    // Query DB directly to avoid HTTP overhead
    const shopAdmin = await ShopAdmin.findById(payload.id).populate('shopId').lean();
    
    if (!shopAdmin || !shopAdmin.shopId) return null;

    return {
      shopName: shopAdmin.shopId.name,
      shopIdString: shopAdmin.shopId.shopId,
      shopLogoUrl: shopAdmin.shopId.logoUrl,
      shopAdminName: shopAdmin.name,
    };
  } catch (error) {
    console.error("Error fetching shop data in layout:", error);
    return null;
  }
}

export default async function ShopLayout({ children }) {
  // Fetch data - this now runs much faster as a direct DB query
  const shopData = await getShopAdminData();
  
  if (!shopData) {
    redirect('/portal-access');
  }

  return (
    <ShopDataProvider serverShopData={shopData}>
      <Toaster position="top-right" />
      
      <div className="flex bg-gray-50 h-screen overflow-hidden">
        {/* Sidebar stays fixed and doesn't re-render on tab switch */}
        <ShopAdminSidebar />
        
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="p-8">
            {/* The loading.jsx will automatically wrap the children during navigation */}
            {children} 
          </div>
        </main>
      </div>
    </ShopDataProvider>
  );
}