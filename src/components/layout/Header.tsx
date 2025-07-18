import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import { UserNav } from './UserNav';
import { getAuthSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import type { User } from '@/types';

async function getUserData(uid: string) {
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) return null;
        return userDoc.data() as User;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        return null;
    }
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
