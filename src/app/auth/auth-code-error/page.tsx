'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AuthCodeError() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-xl">Error de Autenticación</CardTitle>
          <CardDescription>
            Hubo un problema al iniciar sesión con Google. Por favor, inténtalo de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => router.push('/login')} 
            className="w-full"
          >
            Volver al Login
          </Button>
          <div className="text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Ir al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}