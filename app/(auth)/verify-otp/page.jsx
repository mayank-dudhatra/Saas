// 'use client';
// import { useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import Link from 'next/link';

// export default function VerifyOtpPage() {
//   const [otp, setOtp] = useState('');
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const email = searchParams.get('email');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setMessage('');
//     setLoading(true);

//     if (!email) {
//       setError('Email not found. Please start the registration process again.');
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch('/api/auth/verify-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, otp }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         setMessage(`${data.message}\nYour Shop ID is: ${data.shopId}\nShop Code: ${data.shopCode}`);
//         // Redirect to portal access page after 3 seconds
//         setTimeout(() => {
//           router.push('/portal-access');
//         }, 3000);
//       } else {
//         setError(data.message || 'OTP verification failed.');
//       }
//     } catch (err) {
//       setError('An unexpected error occurred.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!email) {
//     return (
//       <div>
//         <h2>Invalid Access</h2>
//         <p>Please <Link href="/signup">start the registration process</Link> to verify an email.</p>
//       </div>
//     );
//   }

//   return (
//     <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
//       <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Verify Your Email</h2>
//       <p style={{ textAlign: 'center', marginBottom: '20px' }}>
//         An OTP has been sent to <strong>{email}</strong>. Please enter it below.
//       </p>
      
//       {message && (
//         <div style={{ 
//           padding: '15px', 
//           backgroundColor: '#d4edda', 
//           border: '1px solid #c3e6cb', 
//           borderRadius: '5px', 
//           marginBottom: '20px'
//         }}>
//           <p style={{ color: '#155724', margin: 0, whiteSpace: 'pre-line' }}>{message}</p>
//           <p style={{ color: '#155724', margin: '10px 0 0 0', fontSize: '14px' }}>Redirecting to login page...</p>
//         </div>
//       )}

//       {!message && (
//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//           <input
//             value={otp}
//             onChange={(e) => setOtp(e.target.value)}
//             placeholder="Enter 6-digit OTP"
//             maxLength="6"
//             required
//             style={{ 
//               padding: '15px', 
//               fontSize: '20px', 
//               textAlign: 'center', 
//               letterSpacing: '10px',
//               borderRadius: '4px', 
//               border: '1px solid #ccc' 
//             }}
//             autoFocus
//           />
//           <button 
//             type="submit" 
//             disabled={loading || !!message}
//             style={{ 
//               padding: '12px', 
//               backgroundColor: '#4CAF50', 
//               color: 'white', 
//               border: 'none', 
//               borderRadius: '4px', 
//               cursor: loading ? 'not-allowed' : 'pointer',
//               opacity: loading ? 0.6 : 1,
//               fontSize: '16px',
//               fontWeight: 'bold'
//             }}
//           >
//             {loading ? 'Verifying...' : 'Verify OTP'}
//           </button>
          
//           {error && (
//             <div style={{ 
//               padding: '10px', 
//               backgroundColor: '#f8d7da', 
//               border: '1px solid #f5c6cb', 
//               borderRadius: '4px' 
//             }}>
//               <p style={{ color: '#721c24', margin: 0 }}>{error}</p>
//             </div>
//           )}
//         </form>
//       )}

//       {!message && (
//         <p style={{ textAlign: 'center', marginTop: '20px' }}>
//           Didn't receive OTP? <Link href="/signup" style={{ color: '#4CAF50' }}>Register again</Link>
//         </p>
//       )}
//     </div>
//   );
// }



'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!email) {
      setError('Email not found. Please start the registration process again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        // Updated message to clearly state that Super Admin approval is the next step
        setMessage(`Success! Your shop request has been registered.\nShop ID: ${data.shopId}\nShop Code: ${data.shopCode}\n\nPlease wait for Super Admin approval before attempting to log in.`);
        
        // Redirect to portal access page after 6 seconds, keeping the form in front for a longer read time
        setTimeout(() => {
          router.push('/portal-access');
        }, 6000);
      } else {
        setError(data.message || 'OTP verification failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div>
        <h2>Invalid Access</h2>
        <p>Please <Link href="/signup">start the registration process</Link> to verify an email.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Verify Your Email</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px' }}>
        An OTP has been sent to <strong>{email}</strong>. Please enter it below.
      </p>
      
      {message && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '5px', 
          marginBottom: '20px'
        }}>
          <p style={{ color: '#155724', margin: 0, whiteSpace: 'pre-line' }}>{message}</p>
          <p style={{ color: '#155724', margin: '10px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>Redirecting to Login Portal...</p>
        </div>
      )}

      {!message && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            required
            style={{ 
              padding: '15px', 
              fontSize: '20px', 
              textAlign: 'center', 
              letterSpacing: '10px',
              borderRadius: '4px', 
              border: '1px solid #ccc' 
            }}
            autoFocus
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
              opacity: loading ? 0.6 : 1,
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          
          {error && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb', 
              borderRadius: '4px' 
            }}>
              <p style={{ color: '#721c24', margin: 0 }}>{error}</p>
            </div>
          )}
        </form>
      )}

      {!message && (
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Didn't receive OTP? <Link href="/signup" style={{ color: '#4CAF50' }}>Register again</Link>
        </p>
      )}
    </div>
  );
}
