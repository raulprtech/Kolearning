'use server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/', '/crear', '/aprender', '/proyectos', '/mis-proyectos', '/perfil', '/tienda', '/tutor', '/ajustes', '/preguntas-frecuentes'];

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => {
    // This handles dynamic routes like /mis-proyectos/[projectId]
    if (route.includes('[')) {
      const baseRoute = route.split('/[')[0];
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });

  // If trying to access a protected route without a session cookie, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If on the login page with a session cookie, redirect to the dashboard
  if (pathname === '/login' && sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
