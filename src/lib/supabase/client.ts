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
        // Custom storage implementation with error handling
        storage: {
          getItem: (key: string) => {
            try {
              if (typeof window === 'undefined') return null;
              return window.localStorage.getItem(key);
            } catch (error) {
              console.warn('localStorage.getItem error:', error);
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            try {
              if (typeof window === 'undefined') return;
              window.localStorage.setItem(key, value);
            } catch (error) {
              console.warn('localStorage.setItem error:', error);
            }
          },
          removeItem: (key: string) => {
            try {
              if (typeof window === 'undefined') return;
              window.localStorage.removeItem(key);
            } catch (error) {
              console.warn('localStorage.removeItem error:', error);
            }
          },
        },
      },
      global: {
        headers: {
          'x-client-info': 'learning-box-web',
        },
      },
    }
  )
}