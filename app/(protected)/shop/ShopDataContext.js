'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the context
const ShopDataContext = createContext(null);

// 2. Create the Provider component
// This will be a client component that wraps your shop pages
export function ShopDataProvider({ serverShopData, children }) {
  // 3. Hold the shop data in state
  const [shopData, setShopData] = useState(serverShopData);

  // 4. This effect syncs the state when the server data changes (on refresh/re-fetch)
  useEffect(() => {
    setShopData(serverShopData);
  }, [serverShopData]);

  // 5. Provide the data AND the setter function to all children
  return (
    <ShopDataContext.Provider value={{ shopData, setShopData }}>
      {children}
    </ShopDataContext.Provider>
  );
}

// 6. Create a simple hook to use the context
export function useShopData() {
  const context = useContext(ShopDataContext);
  if (!context) {
    throw new Error('useShopData must be used within a ShopDataProvider');
  }
  return context;
}