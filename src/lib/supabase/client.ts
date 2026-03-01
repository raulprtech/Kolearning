import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Enable session persistence across browser sessions
        persistSession: true,
        // Automatically refresh tokens when they expire
        autoRefreshToken: true,
        // Detect OAuth callbacks and email confirmations in URLs
        detectSessionInUrl: true,
        // Use PKCE flow for better security in SPAs
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-client-info': 'kolearning-web',
        },
      },
    }
  )
}