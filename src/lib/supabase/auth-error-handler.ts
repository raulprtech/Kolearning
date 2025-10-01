import { AuthError } from '@supabase/supabase-js'
import { createClient } from './client'

/**
 * Centralized auth error handler for Kolearning
 * Handles common authentication errors and provides recovery strategies
 */

export type AuthErrorType =
  | 'INVALID_REFRESH_TOKEN'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

export interface AuthErrorInfo {
  type: AuthErrorType
  message: string
  shouldSignOut: boolean
  shouldRedirect: boolean
  redirectPath?: string
}

/**
 * Analyzes an auth error and returns structured information
 */
export function analyzeAuthError(error: any): AuthErrorInfo {
  const errorMessage = error?.message || String(error)

  // Invalid or missing refresh token
  if (
    errorMessage.includes('Invalid Refresh Token') ||
    errorMessage.includes('Refresh Token Not Found') ||
    errorMessage.includes('refresh_token_not_found')
  ) {
    return {
      type: 'INVALID_REFRESH_TOKEN',
      message: 'Tu sesión ha expirado o es inválida',
      shouldSignOut: true,
      shouldRedirect: true,
      redirectPath: '/login',
    }
  }

  // Session expired
  if (
    errorMessage.includes('expired') ||
    errorMessage.includes('JWT expired')
  ) {
    return {
      type: 'SESSION_EXPIRED',
      message: 'Tu sesión ha expirado',
      shouldSignOut: true,
      shouldRedirect: true,
      redirectPath: '/login',
    }
  }

  // Network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('NetworkError')
  ) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Error de conexión. Por favor verifica tu internet.',
      shouldSignOut: false,
      shouldRedirect: false,
    }
  }

  // Unknown error
  return {
    type: 'UNKNOWN',
    message: 'Ocurrió un error inesperado',
    shouldSignOut: false,
    shouldRedirect: false,
  }
}

/**
 * Handles auth errors by cleaning up invalid sessions
 */
export async function handleAuthError(
  error: any,
  options: {
    silent?: boolean
    onSignOut?: () => void
    onRedirect?: (path: string) => void
  } = {}
): Promise<void> {
  const errorInfo = analyzeAuthError(error)

  // Log error for debugging
  if (!options.silent) {
    console.error('[Auth Error]', {
      type: errorInfo.type,
      message: errorInfo.message,
      originalError: error,
    })
  }

  // Sign out if needed
  if (errorInfo.shouldSignOut) {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      if (!options.silent) {
        console.log('[Auth] Signed out due to error:', errorInfo.type)
      }

      options.onSignOut?.()
    } catch (signOutError) {
      console.error('[Auth] Error during sign out:', signOutError)
    }
  }

  // Redirect if needed
  if (errorInfo.shouldRedirect && errorInfo.redirectPath) {
    options.onRedirect?.(errorInfo.redirectPath)
  }
}

/**
 * Checks if the current session is valid and cleans up if not
 */
export async function validateAndCleanSession(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      await handleAuthError(error, { silent: false })
      return false
    }

    return !!data.session
  } catch (error) {
    await handleAuthError(error, { silent: false })
    return false
  }
}

/**
 * Clears all auth-related storage (useful for hard resets)
 */
export function clearAuthStorage(): void {
  try {
    if (typeof window === 'undefined') return

    // Clear Supabase auth keys
    const authKeys = Object.keys(localStorage).filter(
      (key) =>
        key.startsWith('sb-') ||
        key.includes('supabase') ||
        key.includes('auth-token')
    )

    authKeys.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.warn(`Failed to remove ${key}:`, e)
      }
    })

    console.log('[Auth] Cleared auth storage')
  } catch (error) {
    console.error('[Auth] Error clearing storage:', error)
  }
}
