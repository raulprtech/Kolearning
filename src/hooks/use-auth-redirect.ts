import { useRouter } from 'next/navigation'
import { redirectToLogin } from '@/lib/auth-redirect'

/**
 * Hook to handle authentication redirects
 * @returns Function to redirect to login with current page as return URL
 */
export function useAuthRedirect() {
  const router = useRouter()

  const redirectToLoginWithReturn = () => {
    const currentUrl = window.location.pathname + window.location.search
    redirectToLogin(currentUrl)
  }

  const pushToLogin = (returnUrl?: string) => {
    const currentUrl = returnUrl || window.location.pathname + window.location.search
    router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
  }

  const pushToSignup = (returnUrl?: string) => {
    const currentUrl = returnUrl || window.location.pathname + window.location.search
    router.push(`/signup?redirect=${encodeURIComponent(currentUrl)}`)
  }

  return {
    redirectToLoginWithReturn,
    pushToLogin,
    pushToSignup
  }
}