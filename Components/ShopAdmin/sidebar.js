'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Printer,
  DollarSign,
  Package,
  Truck,
  CreditCard,
  Users,
  Globe,
  BarChart,
  Settings,
  Store,
  LogOut // Import the LogOut icon
} from 'lucide-react';

// --- Icon Mapping ---
const menuItems = [
  { name: 'Dashboard', href: '/shop/dashboard', icon: LayoutDashboard },
  { name: 'Billing / POS', href: '/shop/billing', icon: Printer },
  { name: 'Sale', href: '/shop/sale', icon: DollarSign },
  { name: 'Inventory & Products', href: '/shop/inventory', icon: Package },
  { name: 'Purchase Management', href: '/shop/purchases', icon: Truck },
  { name: 'Expense Management', href: '/shop/expenses', icon: CreditCard },
  { name: 'Customer Management', href: '/shop/customers', icon: Users },
  { name: 'Online Orders', href: '/shop/orders', icon: Globe },
  { name: 'Reports & Analytics', href: '/shop/reports', icon: BarChart },
  { name: 'Shop Settings', href: '/shop/settings', icon: Settings },
];

/**
 * ShopAdminSidebar Component
 * @param {object} props
 * @param {string} props.shopName - The name of the shop.
 * @param {string} props.shopId - The unique ID of the shop.
 * @param {string} [props.shopLogoUrl] - (Optional) URL for the shop's logo.
 */
export default function ShopAdminSidebar({ 
  shopName = "Your Shop Name", 
  shopId = "SHOP001", 
  shopLogoUrl 
}) {
  const pathname = usePathname();
  const router = useRouter(); // Add router for logout

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/portal-access'); // Redirect to login
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white text-gray-700">
      
      {/* Sidebar Header: Shop Info */}
      <div className="flex items-center gap-3 px-4 py-5 bg-green-600 text-white">
        {shopLogoUrl ? (
          <img 
            src={shopLogoUrl} 
            alt={`${shopName} Logo`} 
            className="h-10 w-10 rounded-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700">
            <Store className="h-6 w-6 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-base font-bold leading-tight">{shopName}</h2>
          <span className="text-xs font-medium text-green-100">{shopId}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium
                ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* --- Sidebar Footer with Logout --- */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 text-red-500 group-hover:text-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

