import { Header } from '@/components/layout/Header';
import { UserProvider } from '@/context/UserContext';
import { getAuthSession } from '@/app/actions/auth';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  const isLoggedIn = !!session;

  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <Header isLoggedIn={isLoggedIn} />
        <main className="flex-1 w-full mx-auto">{children}</main>
      </div>
    </UserProvider>
  );
}