import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'abs_finance_super_secret_jwt_key_2026_finance_aios'
);

// Public routes that never require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and internal Next.js requests — always allow
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Explicitly public paths — no token required
  if (PUBLIC_PATHS.includes(pathname)) {
    // If user is already authenticated, redirect away from login page
    if (pathname === '/login') {
      const token = request.cookies.get('abs_session')?.value;
      if (token) {
        try {
          await jwtVerify(token, JWT_SECRET);
          return NextResponse.redirect(new URL('/', request.url));
        } catch {
          // Invalid token — let them see login
        }
      }
    }
    return NextResponse.next();
  }

  // For all other routes (dashboard pages AND API routes), require a valid session
  const token = request.cookies.get('abs_session')?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    // API calls get a JSON 401, page navigations get redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
