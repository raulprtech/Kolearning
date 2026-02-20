import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Apply middleware only to protected routes.
     * Excludes: static files, API routes, auth routes, and public pages
     */
    '/profile/:path*',
    '/projects/:path*',
    '/study/:path*',
    '/new-project/:path*',
    '/archive/:path*',
    '/migrate/:path*',
  ],
}