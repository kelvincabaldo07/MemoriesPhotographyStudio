import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to protect admin routes
 * Enforces authentication on all /admin and /api/admin paths
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all admin routes except login page
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no valid session token, redirect to login
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect all admin API routes
  if (path.startsWith('/api/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no valid session token, return 401 Unauthorized
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to access admin resources.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
