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
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // --- 1. Dynamic Origin Check (FIXED) ---
  let isAllowedOrigin = false;
  
  // Add your specific production domain here if you have a custom domain
  const allowedDomains = ['https://agro-saas.vercel.app', 'http://localhost:3000'];
  
  if (origin) {
    if (allowedDomains.includes(origin)) {
      isAllowedOrigin = true;
    } else if (origin.endsWith('.vercel.app')) {
      // Automatically allow all Vercel preview/production URLs
      isAllowedOrigin = true;
    }
  }

  // --- 2. Handle API Routes (CORS) ---
  if (pathname.startsWith('/api/')) {
    
    // Handle Preflight (OPTIONS) requests
    if (request.method === 'OPTIONS') {
      if (isAllowedOrigin) {
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin, 
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      return new NextResponse(null, { status: 403, statusText: "Forbidden Origin" });
    }

    const response = NextResponse.next();
    
    if (isAllowedOrigin && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  }

  // --- 3. Handle Page Protection (Auth) ---
  const token = request.cookies.get('token')?.value;
  const publicPaths = ['/login', '/signup', '/portal-access', '/verify-otp', '/forgot-password', '/reset-password'];

  // Allow access to public paths without checking token
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Redirect to login if no token is found
  if (!token) {
    const loginUrl = new URL('/portal-access', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const userRole = payload.role;
    const loginUrl = new URL('/portal-access', request.url);

    // Role-based protection
    if (pathname.startsWith('/superadmin') && userRole !== 'superadmin') {
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith('/shop') && userRole !== 'shopadmin') {
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith('/customer') && userRole !== 'customer') {
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error('JWT Verification failed:', err.message);
    const loginUrl = new URL('/portal-access', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/api/:path*',
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