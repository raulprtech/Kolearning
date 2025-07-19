import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Since the dashboard is now at '/', we only need to handle the /login redirect.
  // The root middleware in a group will handle the / to / layout.
  if (pathname === '/login') {
    // If a user is logged in, they should not see the login page.
    // However, since auth is mocked, we can't check for a session here effectively.
    // The login page itself will redirect to '/' if the user is "logged in".
    // For now, let's assume if someone hits /login they should see it.
  }
  
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
