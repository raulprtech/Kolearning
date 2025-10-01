import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Check if the session is valid
    const { data: { session }, error } = await supabase.auth.getSession()

    // If there's a refresh token error, clean up cookies
    if (error) {
      const errorMessage = error.message || String(error)

      // Check for refresh token errors
      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('refresh_token')
      ) {
        console.warn('[Middleware] Invalid refresh token detected, cleaning up cookies')

        // Clear all Supabase auth cookies
        const cookiesToClear = [
          'sb-access-token',
          'sb-refresh-token',
          ...Array.from(request.cookies.getAll())
            .filter((cookie) => cookie.name.startsWith('sb-'))
            .map((cookie) => cookie.name),
        ]

        cookiesToClear.forEach((name) => {
          response.cookies.delete(name)
        })

        // Don't redirect here, let the client handle it
        // This prevents redirect loops
      }
    }

    // Optional: Log session status for debugging in development
    if (process.env.NODE_ENV === 'development' && session) {
      console.log('[Middleware] Valid session for user:', session.user.id)
    }
  } catch (error) {
    console.error('[Middleware] Error checking session:', error)
    // Don't throw, just log and continue
  }

  return response
}