import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

console.log('🔒 Middleware loading...');

export async function middleware(request: NextRequest) {
  console.log('🚀 Middleware executing for path:', request.nextUrl.pathname);
  console.log('🔍 Checking protected routes...');

  // Update user session
  console.log('🔄 Updating user session...');
  const response = await updateSession(request)
  console.log('✅ Session updated');

  // Check if user is accessing protected routes
  if (request.nextUrl.pathname.startsWith('/new-project') ||
      request.nextUrl.pathname.startsWith('/projects') ||
      request.nextUrl.pathname.startsWith('/study') ||
      request.nextUrl.pathname.startsWith('/explore')) {

    console.log('🛡️ Protected route detected, allowing access for now');
    // For now, we'll let all routes pass through
    // Later you can add authentication checks here
    return response
  }

  console.log('✅ Public route, returning response');
  return response
}

console.log('🔧 Middleware config loaded');
console.log('🎯 Matcher pattern configured for all routes except static files');

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}