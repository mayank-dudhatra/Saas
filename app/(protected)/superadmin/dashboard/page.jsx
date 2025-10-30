'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [pendingShops, setPendingShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch pending registration requests
  const fetchPendingShops = async () => {
    setLoading(true);
    setError('');
    try {
      // NOTE: We need a new API endpoint to fetch pending requests. 
      // For this implementation, we will assume a combined endpoint 
      // is available or simplify the fetch for now.
      // Fetch all shops and filter client-side for pending status.
      const res = await fetch('/api/superadmin/pending-shops', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch pending shops.");
      }
      
      const allShops = await res.json();
      // Filter for shops that are newly registered (status 'pending')
      const filteredShops = allShops.filter(shop => shop.status === 'pending');

      // We will also fetch the associated admin for the shop here if needed for better display.
      // Since models/ShopAdmin.js doesn't expose the shopId (string) we need to fetch the shop and then query admin.
      // For simplicity in this demo, we'll list the shop details from the Shop model.
      setPendingShops(filteredShops);
    } catch (err) {
      setError(err.message || 'Error fetching pending shops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingShops();
  }, []);

  // Handle the approval action
  const handleApprove = async (shopId) => {
    setMessage('');
    try {
      const res = await fetch('/api/superadmin/approve-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        // Remove approved shop from the list
        setPendingShops(prev => prev.filter(shop => shop.shopId !== shopId));
      } else {
        setError(data.message || 'Approval failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred during approval.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1>Welcome, Super Admin!</h1>
      <p>This is your protected dashboard. Manage pending shop registration requests here.</p>
      
      <hr style={{ margin: '20px 0' }} />

      <h2>Pending Shop Registrations ({pendingShops.length})</h2>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      {loading ? (
        <p>Loading pending requests...</p>
      ) : pendingShops.length === 0 ? (
        <p>✅ No pending shop registrations require approval.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Shop Name</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Shop ID / Code</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Address</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingShops.map((shop) => (
              <tr key={shop._id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{shop.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{shop.shopId} / {shop.shopCode}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{shop.city}, {shop.state}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button
                    onClick={() => handleApprove(shop.shopId)}
                    style={{ 
                      padding: '8px 15px', 
                      backgroundColor: '#4CAF50', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link href="/api/auth/logout" style={{ display: 'block', marginTop: '20px', textAlign: 'center', color: '#666' }}>
          Logout
      </Link>
    </div>
  );
}