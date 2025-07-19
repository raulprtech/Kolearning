import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import { UserNav } from './UserNav';
import { getAuthSession } from '@/lib/auth';
import type { User } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { UserStats } from './UserStats';

async function getUserData(uid: string): Promise<User | null> {
    const mockTimestamp = {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;

    return {
        uid: 'mock-user-id',
        email: 'test@example.com',
        createdAt: mockTimestamp,
        lastSessionAt: mockTimestamp,
        currentStreak: 5,
        coins: 142,
        energy: 5,
    };
}

export async function Header() {
  const session = await getAuthSession();
  const user = session ? await getUserData(session.uid) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-6xl mx-auto items-center">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookOpenCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">Kolearning</span>
          </Link>
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
             <Link
              href="/tienda"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Tienda
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
