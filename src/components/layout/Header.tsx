import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import { UserNav } from './UserNav';
import { getAuthSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import type { User } from '@/types';
import { Timestamp } from 'firebase/firestore';

async function getUserData(uid: string): Promise<User | null> {
    // Return mock user data since auth is disabled
    // Timestamps are not serializable, so we create mock plain objects for them.
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
    };
}

export async function Header() {
  const session = await getAuthSession();
  const user = session ? await getUserData(session.uid) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <BookOpenCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">Kolearning</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </Link>
            <Link
              href="/tutor"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Tutor
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
           {user && <UserNav user={user} />}
        </div>
      </div>
    </header>
  );
}
