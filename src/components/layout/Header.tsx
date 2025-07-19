import Link from 'next/link';
import { BookOpenCheck, Flame, Zap } from 'lucide-react';
import { UserNav } from './UserNav';
import { getAuthSession } from '@/lib/auth';
import type { User } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

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

const CoinIcon = (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>🪙</span>
);


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
              href="/decks"
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
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
           {user && (
            <div className='flex items-center gap-4 mr-2'>
               <Button variant="ghost" size="sm" className="flex items-center gap-2 text-orange-500">
                  <Flame className="h-5 w-5" />
                  <span className="font-bold">{user.currentStreak}</span>
               </Button>
               <Button variant="ghost" size="sm" className="flex items-center gap-2 text-yellow-500">
                  <CoinIcon className="h-5 w-5" />
                  <span className="font-bold">{user.coins}</span>
               </Button>
               <Button variant="ghost" size="sm" className="flex items-center gap-2 text-primary">
                  <Zap className="h-5 w-5" />
                  <span className="font-bold">{user.energy}</span>
               </Button>
            </div>
           )}
           {user && <UserNav user={user} />}
        </div>
      </div>
    </header>
  );
}
