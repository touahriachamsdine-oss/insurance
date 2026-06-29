import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { verifySession } from '@/lib/auth-utils';

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip proxy for static assets, public files, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Helper to extract locale or default to 'ar'
  const getLocaleFromPath = (path: string) => {
    const segments = path.split('/');
    if (segments[1] === 'en' || segments[1] === 'ar') {
      return segments[1];
    }
    return 'ar';
  };

  const locale = getLocaleFromPath(pathname);

  // Strip locale prefix if present to check clean route names
  const cleanPathname = pathname.replace(/^\/(ar|en)/, '') || '/';

  // 2. Fetch session token from cookies
  const token = request.cookies.get('daman-session')?.value;
  const session = token ? verifySession(token) : null;

  // Define route accessibility
  const isAuthPage = cleanPathname === '/login' || cleanPathname === '/register';
  const isProtectedAdmin = cleanPathname.startsWith('/admin');
  const isProtectedCompany = cleanPathname.startsWith('/company');
  const isProtectedClient = cleanPathname.startsWith('/client');
  const isProtectedRoute = isProtectedAdmin || isProtectedCompany || isProtectedClient;

  // 3. Auth route checks
  if (session) {
    // Logged in user tries to visit login or register
    if (isAuthPage) {
      const dashboardPath = getDashboardPathForRole(session.role);
      return NextResponse.redirect(new URL(`/${locale}${dashboardPath}`, request.url));
    }

    // Role-based access control (RBAC) checks
    if (isProtectedAdmin && session.role !== 'superadmin') {
      const properDashboard = getDashboardPathForRole(session.role);
      return NextResponse.redirect(new URL(`/${locale}${properDashboard}`, request.url));
    }

    if (isProtectedCompany && session.role !== 'company_admin' && session.role !== 'company_agent') {
      const properDashboard = getDashboardPathForRole(session.role);
      return NextResponse.redirect(new URL(`/${locale}${properDashboard}`, request.url));
    }

    if (isProtectedClient && session.role !== 'client') {
      const properDashboard = getDashboardPathForRole(session.role);
      return NextResponse.redirect(new URL(`/${locale}${properDashboard}`, request.url));
    }
  } else {
    // Unauthenticated user trying to access any protected dashboard
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // 4. Default to next-intl I18n route handling
  return handleI18nRouting(request);
}

function getDashboardPathForRole(role: string): string {
  switch (role) {
    case 'superadmin':
      return '/admin';
    case 'company_admin':
    case 'company_agent':
      return '/company';
    case 'client':
    default:
      return '/client';
  }
}

export const config = {
  // Match all paths except API and static assets
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
