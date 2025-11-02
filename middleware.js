import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// --- 1. Define your allowed origins ---
// We use HTTPS for the Vercel app as it's standard.
const allowedOrigins = [
  'https://agro-saas.vercel.app',
  'http://localhost:3000',
];

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

  // --- 2. Handle all API route requests ---
  if (pathname.startsWith('/api/')) {
    
    // Check if the origin is allowed
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);

    // Handle CORS Preflight (OPTIONS) requests
    if (request.method === 'OPTIONS') {
      if (isAllowedOrigin) {
        return new NextResponse(null, {
          status: 204, // No Content
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      // Disallow OPTIONS requests from other origins
      return new NextResponse(null, { status: 403, statusText: "Forbidden Origin" });
    }

    // Handle actual API requests (GET, POST, etc.)
    const response = NextResponse.next(); // Let the request go to the route handler
    
    // Add CORS headers to the response
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  }

  // --- 3. Handle PAGE requests (existing auth logic) ---
  const token = request.cookies.get('token')?.value;
  const publicPaths = ['/login', '/signup', '/portal-access', '/verify-otp', '/forgot-password', '/reset-password'];

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check token for protected paths
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

// --- 4. UPDATE THE MATCHER ---
// Add '/api/:path*' to make the middleware run on all API routes
export const config = {
  matcher: [
    '/api/:path*', // <-- This line is added
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