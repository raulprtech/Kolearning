import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update user session
  const response = await updateSession(request)

  // Check if user is accessing protected routes
  if (request.nextUrl.pathname.startsWith('/new-project') || 
      request.nextUrl.pathname.startsWith('/projects') ||
      request.nextUrl.pathname.startsWith('/study') ||
      request.nextUrl.pathname.startsWith('/explore')) {
    
    // For now, we'll let all routes pass through
    // Later you can add authentication checks here
    return response
  }

  return response
}

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