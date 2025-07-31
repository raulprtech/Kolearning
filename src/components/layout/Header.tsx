'use client';

import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import { UserNav } from './UserNav';
import { UserStats } from './UserStats';
import { useUser } from '@/context/UserContext';

export function Header() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl mx-auto items-center">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookOpenCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">Kolearning</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {user && (
              <>
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
              </>
            )}
             <Link
                href="/blog"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Blog
              </Link>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
           {user && <UserStats user={user} />}
           {user && <UserNav user={user} />}
        </div>
      </div>
    </header>
  );
}
