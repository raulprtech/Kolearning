
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/logo';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { signup } = useProjects();
  const { toast } = useToast();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const success = signup(name, email, password);
    if (success) {
      toast({
        title: '¡Cuenta Creada!',
        description: 'Tu cuenta ha sido creada exitosamente.',
      });
      router.push('/'); // Redirect to dashboard
    } else {
      toast({
        title: 'Error de registro',
        description: 'Este correo electrónico ya está en uso.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">
            Kolearning
          </h1>
        </Link>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>
            Ingresa tu información para empezar a aprender.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name" 
                placeholder="Tu nombre" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Crear cuenta
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
