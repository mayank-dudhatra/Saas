import ShopAdminSidebar from "@/Components/ShopAdmin/sidebar"; 
// Make sure the import path is correct based on your `jsconfig.json` ("@/...")

export default function ShopLayout({ children }) {
  
  // --- IMPORTANT ---
  // You will need to fetch the real shopName and shopId here,
  // probably by verifying the JWT token stored in the cookies.
  // For now, I'm using placeholder data.
  const shopData = {
    shopName: "Mayank's Agro Shop",
    shopId: "SHOP007",
    shopLogoUrl: null // or a path to a logo
  };

  return (
    <div className="flex bg-gray-50">
      {/* Sidebar Component */}
      <ShopAdminSidebar 
        shopName={shopData.shopName}
        shopId={shopData.shopId}
        shopLogoUrl={shopData.shopLogoUrl}
      />

      {/* Page Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        {/* You can add a header/navbar here if you want */}
        <div className="p-8">
          {children} 
          {/* This 'children' prop is where your page.jsx files will be rendered */}
        </div>
      </main>
    </div>
  );
}
