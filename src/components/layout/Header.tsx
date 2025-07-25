'use client';

import Link from 'next/link';
import { BookOpenCheck, ArrowRight } from 'lucide-react';
import { UserNav } from './UserNav';
import { UserStats } from './UserStats';
import { useUser } from '@/context/UserContext';
import { Button } from '../ui/button';

export function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-6xl mx-auto items-center">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookOpenCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">Kolearning</span>
          </Link>
          {isLoggedIn && (
             <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
             <Link
              href="/proyectos"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Proyectos
            </Link>
            <Link
              href="/tutor"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Tutor
            </Link>
        </nav>
          )}
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
           {isLoggedIn && user ? (
            <>
              <UserStats user={user} />
              <UserNav user={user} />
            </>
           ) : (
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                    <Link href="/login">
                        Empezar a Aprender
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
           )}
        </div>
      </div>
    </header>
  );
}