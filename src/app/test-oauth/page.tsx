'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestOAuth() {
  const [status, setStatus] = useState('')
  const supabase = createClient()

  const testGoogleOAuth = async () => {
    setStatus('Testing Google OAuth...')
    
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/test-oauth')}`
      console.log('Testing with redirect URL:', redirectTo)
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
        },
      })

      console.log('OAuth test result:', { error, data })
      
      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus('OAuth initiated successfully')
      }
    } catch (error) {
      console.error('OAuth test error:', error)
      setStatus(`Catch error: ${error}`)
    }
  }

  const checkSupabaseConfig = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Supabase config:', {
      url: url ? `${url.slice(0, 30)}...` : 'missing',
      key: key ? `${key.slice(0, 30)}...` : 'missing'
    })
    
    setStatus(`URL: ${url ? 'present' : 'missing'}, Key: ${key ? 'present' : 'missing'}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OAuth Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkSupabaseConfig} variant="outline" className="w-full">
            Check Supabase Config
          </Button>
          
          <Button onClick={testGoogleOAuth} className="w-full">
            Test Google OAuth
          </Button>
          
          {status && (
            <div className="p-3 bg-gray-100 rounded-md">
              <pre className="text-sm">{status}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}