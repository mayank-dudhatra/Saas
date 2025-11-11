// import { cookies } from 'next/headers';
// import { jwtVerify } from 'jose';
// import ShopAdminSidebar from "@/Components/ShopAdmin/sidebar"; 
// import { redirect } from 'next/navigation';
// import React from 'react';
// import { ShopDataProvider } from './ShopDataContext';
// import { headers } from 'next/headers'; // Import headers

// export const dynamic = 'force-dynamic';

// // Helper function to get JWT secret
// const getJwtSecretKey = () => {
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     throw new Error('JWT Secret key is not set in environment variables');
//   }
//   return new TextEncoder().encode(secret);
// };

// // --- NEW Data Fetching Function ---
// async function getShopAdminData() {
//   try {
//     // We need to get the cookie and pass it to the API route manually
//     const cookieStore = await cookies();
//     const token = cookieStore.get('token');

//     if (!token) return null;

//     // Use the full internal URL for the fetch
//     const host = headers().get('host');
//     const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
//     const url = `${protocol}://${host}/api/shop/me`;

//     const res = await fetch(url, {
//       // Pass the cookie to the API route for authentication
//       headers: {
//         'Cookie': `token=${token.value}`
//       },
//       // --- THIS IS THE 7-DAY CACHING ---
//       next: { 
//         revalidate: 604800,  // 7 days in seconds
//         tags: ['shop-data'] // Tag for on-demand revalidation
//       }
//     });

//     if (!res.ok) {
//       console.error("Failed to fetch shop data, status:", res.status);
//       return null;
//     }

//     const shopData = await res.json();
//     console.log("getShopAdminData (Layout) fetched. Found logoUrl:", shopData.shopLogoUrl);
//     return shopData;

//   } catch (error) {
//     console.error("Error fetching shop admin data in layout:", error);
//     return null;
//   }
// }

// // Simple auth check. The /api/shop/me route will do the full verification.
// async function verifyAuth() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get('token')?.value;
//   if (!token) return false;

//   try {
//     // Quick verification
//     await jwtVerify(token, getJwtSecretKey());
//     return true;
//   } catch {
//     return false;
//   }
// }


// export default async function ShopLayout({ children }) {
  
//   // Verify auth first
//   const isAuthenticated = await verifyAuth();
//   if (!isAuthenticated) {
//     redirect('/portal-access');
//   }

//   // Fetch the data (will be cached)
//   const shopData = await getShopAdminData();
  
//   // If auth passed but data failed (e.g., user deleted in DB)
//   if (!shopData) {
//     console.error("Authenticated but failed to get shop data. Logging out.");
//     redirect('/portal-access');
//   }

//   return (
//     // Pass the server-fetched data into the Provider
//     <ShopDataProvider serverShopData={shopData}>
//       <div className="flex bg-gray-50">
        
//         {/* The Sidebar will now pull data from the context */}
//         <ShopAdminSidebar />

//         <main className="flex-1 h-screen overflow-y-auto">
//           <div className="p-8">
//             {children} 
//           </div>
//         </main>
//       </div>
//     </ShopDataProvider>
//   );
// }


import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import ShopAdminSidebar from "@/Components/ShopAdmin/sidebar"; 
import { redirect } from 'next/navigation';
import React from 'react';
import { ShopDataProvider } from './ShopDataContext';
import { headers } from 'next/headers';
import { Toaster } from 'react-hot-toast'; // <-- 1. IMPORT THE TOASTER

export const dynamic = 'force-dynamic';

// Helper function to get JWT secret
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT Secret key is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
};

// --- Data Fetching Function (with 7-day cache) ---
async function getShopAdminData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) return null;

    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const url = `${protocol}://${host}/api/shop/me`;

    const res = await fetch(url, {
      headers: {
        'Cookie': `token=${token.value}`
      },
      next: { 
        revalidate: 604800,  // 7 days in seconds
        tags: ['shop-data'] 
      }
    });

    if (!res.ok) {
      console.error("Failed to fetch shop data, status:", res.status);
      return null;
    }

    const shopData = await res.json();
    console.log("getShopAdminData (Layout) fetched. Found logoUrl:", shopData.shopLogoUrl);
    return shopData;

  } catch (error) {
    console.error("Error fetching shop admin data in layout:", error);
    return null;
  }
}

// Simple auth check
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getJwtSecretKey());
    return true;
  } catch {
    return false;
  }
}


export default async function ShopLayout({ children }) {
  
  const isAuthenticated = await verifyAuth();
  if (!isAuthenticated) {
    redirect('/portal-access');
  }

  const shopData = await getShopAdminData();
  
  if (!shopData) {
    console.error("Authenticated but failed to get shop data. Logging out.");
    redirect('/portal-access');
  }

  return (
    <ShopDataProvider serverShopData={shopData}>
      {/* --- 2. ADD THE TOASTER COMPONENT HERE --- */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000, 
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#16a34a', // green-600
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#dc2626', // red-600
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="flex bg-gray-50">
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