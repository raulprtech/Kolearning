/**
 * Helper functions for handling authentication redirects
 */

/**
 * Redirects to login page with a specific return URL
 * @param returnUrl - The URL to redirect to after successful login
 */
export function redirectToLogin(returnUrl?: string) {
  const currentUrl = returnUrl || window.location.pathname + window.location.search;
  const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;
  window.location.href = loginUrl;
}

/**
 * Redirects to signup page with a specific return URL
 * @param returnUrl - The URL to redirect to after successful signup
 */
export function redirectToSignup(returnUrl?: string) {
  const currentUrl = returnUrl || window.location.pathname + window.location.search;
  const signupUrl = `/signup?redirect=${encodeURIComponent(currentUrl)}`;
  window.location.href = signupUrl;
}

/**
 * Gets the redirect URL from search params, defaults to dashboard
 * @param searchParams - URLSearchParams from the current page
 * @returns The sanitized redirect URL
 */
export function getRedirectUrl(searchParams: URLSearchParams): string {
  const redirect = searchParams.get('redirect');
  
  // Validate and sanitize the redirect URL
  if (redirect) {
    try {
      const url = new URL(redirect, window.location.origin);
      // Only allow same-origin redirects for security
      if (url.origin === window.location.origin) {
        return redirect;
      }
    } catch {
      // Invalid URL, fall through to default
    }
  }
  
  return '/';
}