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

  // --- 1. Dynamic Origin Check ---
  // Allow localhost, the specific production domain, AND any Vercel preview URLs
  let isAllowedOrigin = false;
  
  const allowedDomains = ['https://agro-saas.vercel.app', 'http://localhost:3000'];
  
  if (origin) {
    if (allowedDomains.includes(origin)) {
      isAllowedOrigin = true;
    } else if (origin.endsWith('.vercel.app')) {
      // Allow all vercel preview deployments (e.g. agro-saas-git-main.vercel.app)
      isAllowedOrigin = true;
    }
  }

  // --- 2. Handle API Routes (CORS) ---
  if (pathname.startsWith('/api/')) {
    
    // Handle Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      if (isAllowedOrigin) {
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin, // Return the requested origin
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      // If origin not allowed, return 403
      return new NextResponse(null, { status: 403, statusText: "Forbidden Origin" });
    }

    // Handle Actual Request
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