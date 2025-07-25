'use server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The root route '/' is now public, it will handle showing the landing page or the dashboard.
const protectedRoutes = ['/crear', '/aprender', '/proyectos', '/mis-proyectos', '/perfil', '/tienda', '/tutor', '/ajustes', '/preguntas-frecuentes'];
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => {
    // Handle dynamic routes like /mis-proyectos/[projectId]
    if (route.includes('[')) {
      const baseRoute = route.split('/[')[0];
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });
  
  // If trying to access a protected route without a session, redirect to login.
  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If trying to access an auth route with a session, redirect to the dashboard.
  if (authRoutes.includes(pathname) && sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher now excludes the root route '/' from being always considered protected.
  matcher: [
    '/crear',
    '/aprender',
    '/proyectos/:path*',
    '/mis-proyectos/:path*',
    '/perfil',
    '/tienda',
    '/tutor',
    '/ajustes',
    '/preguntas-frecuentes',
    '/login'
  ],
}