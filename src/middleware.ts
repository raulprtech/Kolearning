import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthSession } from './lib/auth'

const protectedRoutes = ['/', '/crear', '/aprender', '/proyectos', '/mis-proyectos', '/perfil', '/tienda', '/tutor', '/ajustes', '/preguntas-frecuentes'];

export async function middleware(request: NextRequest) {
  const session = await getAuthSession();
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes('[')) {
      // Handle dynamic routes like /mis-proyectos/[projectId]
      const baseRoute = route.split('/[')[0];
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });

  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export const runtime = 'nodejs';
