'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!email) {
      setError('No email found. Please start the process again.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/shopadmin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          otp: formData.otp, 
          newPassword: formData.newPassword 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setFormData({ otp: '', newPassword: '', confirmPassword: '' });
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/portal-access');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
        <h2 style={{ color: 'red' }}>Invalid Request</h2>
        <p>No email address was provided. Please start the password reset process again.</p>
        <Link href="/forgot-password" style={{ color: '#4CAF50' }}>Go to Forgot Password</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Set New Password</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        An OTP was sent to <strong>{email}</strong>.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          name="otp" 
          placeholder="Enter 6-digit OTP" 
          value={formData.otp}
          onChange={handleChange}
          maxLength="6"
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="newPassword" 
          type="password"
          placeholder="Enter new password" 
          value={formData.newPassword}
          onChange={handleChange}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          name="confirmPassword" 
          type="password"
          placeholder="Confirm new password" 
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={loading || !!message}
          style={{ 
            padding: '12px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (loading || !!message) ? 0.6 : 1
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
      </form>
    </div>
  );
}
