import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT Secret key is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
};

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/signup', '/portal-access', '/verify-otp', '/forgot-password', '/reset-password', '/api/auth'];
  
  // Allow public paths and API routes to be accessed without a token
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/portal-access', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const userRole = payload.role;
    const loginUrl = new URL('/portal-access', request.url);

    // Super Admin routes
    if (pathname.startsWith('/superadmin') && userRole !== 'superadmin') {
      return NextResponse.redirect(loginUrl);
    }

    // --- UPDATED: Shop Admin routes ---
    if (pathname.startsWith('/shop') && userRole !== 'shopadmin') {
      return NextResponse.redirect(loginUrl);
    }
    
    // Customer routes
    if (pathname.startsWith('/customer') && userRole !== 'customer') {
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error('JWT Verification failed:', err.message);
    const loginUrl = new URL('/portal-access', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Define which paths the middleware should run on
export const config = {
  matcher: [
    // --- UPDATED: Protect /shop instead of /dashboard ---
    '/shop/:path*',
    '/superadmin/:path*',
    '/customer/:path*',
    '/login',
    '/signup',
    '/portal-access',
    '/forgot-password',
    '/reset-password'
  ],
};
