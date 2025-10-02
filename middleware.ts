import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Simplified matcher to reduce Edge Runtime conflicts.
     * Only apply middleware to specific routes that need auth checks.
     * Exclude API routes, static files, and internal Next.js routes.
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}