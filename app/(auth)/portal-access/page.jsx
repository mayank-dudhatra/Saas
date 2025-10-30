'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalAccess() {
  const [activeTab, setActiveTab] = useState('shopadmin'); // 'shopadmin', 'customer', 'superadmin'
  
  // Shop Admin state
  const [shopAdminEmail, setShopAdminEmail] = useState('');
  const [shopAdminPhone, setShopAdminPhone] = useState('');
  const [shopAdminPassword, setShopAdminPassword] = useState('');
  const [useShopAdminPhone, setUseShopAdminPhone] = useState(false);
  
  // Customer state
  const [customerShopId, setCustomerShopId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  
  // Super Admin state
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleShopAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {
        password: shopAdminPassword,
      };
      
      if (useShopAdminPhone) {
        body.phone = shopAdminPhone;
      } else {
        body.email = shopAdminEmail;
      }

      const res = await fetch('/api/auth/shopadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to log in.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: customerShopId,
          phone: customerPhone,
          password: customerPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // TODO: redirect to customer dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to log in.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: superAdminEmail,
          password: superAdminPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/superadmin/dashboard');
      } else {
        setError(data.message || 'Failed to log in.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Portal Access</h2>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => { setActiveTab('shopadmin'); setError(''); }}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'shopadmin' ? '2px solid #4CAF50' : '2px solid transparent',
            color: activeTab === 'shopadmin' ? '#4CAF50' : '#666',
          }}
        >
          Shop Admin
        </button>
        <button
          onClick={() => { setActiveTab('customer'); setError(''); }}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'customer' ? '2px solid #4CAF50' : '2px solid transparent',
            color: activeTab === 'customer' ? '#4CAF50' : '#666',
          }}
        >
          Customer
        </button>
        <button
          onClick={() => { setActiveTab('superadmin'); setError(''); }}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'superadmin' ? '2px solid #4CAF50' : '2px solid transparent',
            color: activeTab === 'superadmin' ? '#4CAF50' : '#666',
          }}
        >
          Super Admin
        </button>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

      {/* Shop Admin Login Form */}
      {activeTab === 'shopadmin' && (
        <form onSubmit={handleShopAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                checked={!useShopAdminPhone}
                onChange={() => setUseShopAdminPhone(false)}
              />
              Email
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                checked={useShopAdminPhone}
                onChange={() => setUseShopAdminPhone(true)}
              />
              Phone
            </label>
          </div>
          {!useShopAdminPhone ? (
            <input
              type="email"
              value={shopAdminEmail}
              onChange={(e) => setShopAdminEmail(e.target.value)}
              placeholder="Email *"
              required
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          ) : (
            <input
              type="tel"
              value={shopAdminPhone}
              onChange={(e) => setShopAdminPhone(e.target.value)}
              placeholder="Phone Number *"
              required
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          )}
          <input
            type="password"
            value={shopAdminPassword}
            onChange={(e) => setShopAdminPassword(e.target.value)}
            placeholder="Password *"
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}

      {/* Customer Login Form */}
      {activeTab === 'customer' && (
        <form onSubmit={handleCustomerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            value={customerShopId}
            onChange={(e) => setCustomerShopId(e.target.value)}
            placeholder="Shop ID (e.g., SHOP001) *"
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone Number *"
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            value={customerPassword}
            onChange={(e) => setCustomerPassword(e.target.value)}
            placeholder="Password *"
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}

      {/* Super Admin Login Form */}
      {activeTab === 'superadmin' && (
        <form onSubmit={handleSuperAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="email"
            value={superAdminEmail}
            onChange={(e) => setSuperAdminEmail(e.target.value)}
            placeholder="Email *"
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            value={superAdminPassword}
            onChange={(e) => setSuperAdminPassword(e.target.value)}
            placeholder="Password *"
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
    </div>
  );
}