'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    state: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // In development, show the OTP in console and alert
        if (data.devOtp) {
          console.log("🧪 Development Mode - OTP:", data.devOtp);
          // alert(`Development Mode: Your OTP is ${data.devOtp}\n(This alert only appears in development)`);
        }
        
        // Redirect to OTP page on success
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register Your Shop</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          name="shopName" 
          placeholder="Shop Name *" 
          value={formData.shopName}
          onChange={handleChange} 
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="ownerName" 
          placeholder="Your Full Name *" 
          value={formData.ownerName}
          onChange={handleChange} 
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="email" 
          type="email" 
          placeholder="Email *" 
          value={formData.email}
          onChange={handleChange} 
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="phone" 
          type="tel" 
          placeholder="Phone Number *" 
          value={formData.phone}
          onChange={handleChange} 
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password *" 
          value={formData.password}
          onChange={handleChange} 
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="address" 
          placeholder="Address" 
          value={formData.address}
          onChange={handleChange}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="city" 
          placeholder="City" 
          value={formData.city}
          onChange={handleChange}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="state" 
          placeholder="State" 
          value={formData.state}
          onChange={handleChange}
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
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Sending OTP...' : 'Register'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account? <Link href="/login" style={{ color: '#4CAF50' }}>Login</Link>
      </p>
    </div>
  );
}