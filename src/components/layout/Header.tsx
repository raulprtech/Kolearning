'use client';

import Link from 'next/link';
import { BookOpenCheck, ArrowRight } from 'lucide-react';
import { UserNav } from './UserNav';
import { UserStats } from './UserStats';
import { useUser } from '@/context/UserContext';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { user } = useUser();
  const pathname = usePathname();

  if (!isLoggedIn) {
      return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-6xl mx-auto items-center">
            <div className="flex items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
                <BookOpenCheck className="h-6 w-6 text-primary" />
                <span className="font-bold">Kolearning</span>
            </Link>
            </div>
            
            <div className="flex flex-1 items-center justify-end space-x-2">
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
            </div>
        </div>
        </header>
      )
  }

  // Hide header on main dashboard page for logged-in users
  if (pathname === '/') {
      return null;
  }
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex-1">
            {/* We can add breadcrumbs here in the future */}
        </div>
        <div className="flex items-center gap-4">
           {user && <UserStats user={user} />}
           {user && <UserNav user={user} />}
        </div>
    </header>
  );
}
