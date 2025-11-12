'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchasesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the default sub-page for purchases
    router.replace('/shop/purchases/bills');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">Redirecting to Purchase Bills...</p>
    </div>
  );
}