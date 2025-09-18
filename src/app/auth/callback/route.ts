import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback called:', {
    url: request.url,
    code: code ? 'present' : 'missing',
    next,
    origin
  })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Session exchange result:', { error: error?.message })
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const redirectUrl = isLocalEnv ? `${origin}${next}` : 
                          forwardedHost ? `https://${forwardedHost}${next}` : `${origin}${next}`
      
      console.log('Redirecting to:', redirectUrl)
      
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Exchange code error:', error)
    }
  } else {
    console.error('No code received in callback')
  }

  // return the user to an error page with instructions
  console.log('Redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}