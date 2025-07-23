'use server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/', '/crear', '/aprender', '/proyectos', '/mis-proyectos', '/perfil', '/tienda', '/tutor', '/ajustes', '/preguntas-frecuentes'];

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes('[')) {
      const baseRoute = route.split('/[')[0];
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });

  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

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
