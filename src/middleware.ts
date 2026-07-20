import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'malaaby-ultra-secure-and-private-jwt-secret-key-2026';
const KEY = new TextEncoder().encode(SECRET_KEY);

const COOKIE_NAME = 'malaaby_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // 1. Route requires Stadium Owner Dashboard access
  if (isDashboardRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, KEY);
      const role = payload.role as string;
      if (role !== 'owner' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      // Invalid JWT
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // 2. Route requires Super Admin access
  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, KEY);
      const role = payload.role as string;
      if (role !== 'super_admin') {
        // Forbidden - redirect owners/customers to home or dashboard
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Invalid JWT
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // 3. User is already logged in, block them from accessing login/register
  if (isAuthRoute && token) {
    try {
      const { payload } = await jwtVerify(token, KEY);
      const role = payload.role as string;
      if (role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (role === 'owner') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Bad token, allow them to view login page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ],
};
