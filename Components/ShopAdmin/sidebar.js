'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Printer, DollarSign, Package, Truck,
  CreditCard, Users, Globe, BarChart, Settings, Store, LogOut,
  ChevronDown, Building, Receipt // New icons
} from 'lucide-react';
import { useShopData } from '@/app/(protected)/shop/ShopDataContext';
import { useState } from 'react'; // Import useState

// --- 1. UPDATED MENU ITEMS ---
// "Purchase Management" is now an object with subItems.
const menuItems = [
  { name: 'Dashboard', href: '/shop/dashboard', icon: LayoutDashboard },
  { name: 'Billing / POS', href: '/shop/billing', icon: Printer },
  { name: 'Sale', href: '/shop/sale', icon: DollarSign },
  { name: 'Inventory & Products', href: '/shop/inventory', icon: Package },
  { 
    name: 'Purchase Management', 
    icon: Truck, 
    baseHref: '/shop/purchases', // Base path for highlighting
    subItems: [
      { name: 'Purchase Bills', href: '/shop/purchases/bills', icon: Receipt },
      { name: 'Add Parties', href: '/shop/purchases/parties', icon: Building },
    ] 
  },
  { name: 'Expense Management', href: '/shop/expenses', icon: CreditCard },
  { name: 'Customer Management', href: '/shop/customers', icon: Users },
  { name: 'Online Orders', href: '/shop/orders', icon: Globe },
  { name: 'Reports & Analytics', href: '/shop/reports', icon: BarChart },
  { name: 'Shop Settings', href: '/shop/settings', icon: Settings },
];

export default function ShopAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter(); 
  const { shopData } = useShopData();
  
  // --- 2. ADD STATE FOR SUB-MENU ---
  const [openSubMenu, setOpenSubMenu] = useState(null);

  const handleLogout = async () => {
    // ... (logout logic remains the same)
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/portal-access'); 
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const toggleSubMenu = (name) => {
    setOpenSubMenu(openSubMenu === name ? null : name);
  };

  if (!shopData) {
    // ... (loading state remains the same)
    return (
      <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white text-gray-700">
        <div className="flex items-center gap-3 px-4 py-5 bg-green-600 text-white">
          <div className="h-10 w-10 rounded-full bg-green-700"></div>
          <div>
            <div className="h-4 w-32 bg-green-700 rounded"></div>
            <div className="h-3 w-24 bg-green-700 rounded mt-1"></div>
          </div>
        </div>
      </div>
    );
  }

  const { shopName, shopAdminName, shopLogoUrl } = shopData;

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white text-gray-700">
      
      {/* --- Shop Header (remains the same) --- */}
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
          <span className="text-xs font-medium text-green-100">{shopAdminName}</span>
        </div>
      </div>

      {/* --- 3. UPDATED NAVIGATION LINKS --- */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item) => {
          
          // --- If it's a sub-menu item ---
          if (item.subItems) {
            const isParentActive = pathname.startsWith(item.baseHref);
            const isOpen = openSubMenu === item.name || (isParentActive && openSubMenu === null); // Auto-open if active

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleSubMenu(item.name)}
                  className={`
                    group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium
                    ${
                      isParentActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isParentActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
                  />
                </button>
                {/* --- Render Sub-menu --- */}
                {isOpen && (
                  <div className="pl-6 space-y-1 py-1">
                    {item.subItems.map((subItem) => {
                      const isChildActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`
                            group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium
                            ${
                              isChildActive
                                ? 'text-green-700 font-semibold'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }
                          `}
                        >
                          <subItem.icon className={`h-4 w-4 ${isChildActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          // --- If it's a normal link ---
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium
                ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-600 font-semibold'
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

      {/* --- Logout (remains the same) --- */}
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