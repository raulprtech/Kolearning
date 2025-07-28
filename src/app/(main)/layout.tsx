import { Header } from '@/components/layout/Header';
import { UserProvider } from '@/context/UserContext';
import { getAuthSession } from '@/app/actions/auth';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          {session?.uid && <AppSidebar />}
          <main className="flex-1 w-full">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
