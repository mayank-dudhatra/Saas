'use client';
import React from 'react';

// This is the main dashboard page for the Shop Admin.
// The logout button has been removed and is now handled by the sidebar in the layout.
export default function ShopAdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Welcome, Shop Admin!</h1>
      <p className="mt-2 text-gray-600">This is your shop management dashboard. Here you will add customers and manage your shop.</p>
      
      {/* You can start adding dashboard widgets here, e.g.:
        - Quick stats (Total Sales, New Customers)
        - Recent Orders
        - Low Stock Alerts
      */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Sales</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">₹0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">New Customers</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Pending Orders</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
