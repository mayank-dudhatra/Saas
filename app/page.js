import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Welcome to the Platform</h1>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
        <Link href="/login">Shop Admin Login</Link>
        <Link href="/signup">Register a new Shop</Link>
        <Link href="/portal-access">Super Admin Portal (Secret)</Link>
      </div>
    </div>
  );
}