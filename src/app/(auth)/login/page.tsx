'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getRedirectUrl } from '@/lib/auth-redirect'
import Link from 'next/link'
import { Loader2, Brain } from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const supabase = createClient()

  const redirectUrl = getRedirectUrl(searchParams)

  useEffect(() => {
    console.log('[LoginContent] Effect triggered:', { loading, hasUser: !!user, redirectUrl });
    // Redirect if user is already logged in and not loading
    if (!loading && user) {
      console.log('[LoginContent] Routing to:', redirectUrl);
      router.push(redirectUrl)
    }
  }, [user, loading, router, redirectUrl])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: 'Error al iniciar sesión',
          description: error.message,
          variant: 'destructive',
        })
        setIsLoading(false)
      } else {
        toast({
          title: '¡Bienvenido de vuelta!',
          description: 'Has iniciado sesión correctamente. Redirigiendo...',
        })
        // Force navigation immediately
        router.push(redirectUrl)
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`;
      console.log('OAuth redirect URL:', redirectTo);
      console.log('Redirect URL:', redirectUrl);

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
        },
      })

      console.log('OAuth response:', { error, data });

      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        setIsLoading(false);
      }
    } catch (error) {
      console.error('OAuth catch error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al iniciar sesión con Google.',
        variant: 'destructive',
      })
      setIsLoading(false);
    }
  }

  // Only show spinner briefly if we already know there's a user (prevents flash of login form)
  if (user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Log In</CardTitle>
          <CardDescription>
            Enter your Kolearning account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full mt-4"
              disabled={isLoading}
            >
              Continue with Google
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href={`/signup?redirect=${encodeURIComponent(redirectUrl)}`} className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}