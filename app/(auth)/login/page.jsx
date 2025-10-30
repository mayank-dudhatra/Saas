'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to portal-access page which has all login forms
    router.replace('/portal-access');
  }, [router]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <p>Redirecting to login page...</p>
    </div>
  );
}