'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call the existing logout API endpoint
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        // Redirect to the portal access page after successful logout
        router.push('/portal-access');
      } else {
        // Handle unexpected logout failure
        console.error("Logout failed on server side.");
        alert("Logout failed. Please try clearing your cookies manually.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred during logout.");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1>Welcome, Customer!</h1>
      <p>This is your customer dashboard. You can view your purchase history and account details here.</p>
      
      {/* You can add customer-specific content here */}

      <button 
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#dc3545', /* Red color */
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        Logout
      </button>
    </div>
  );
}