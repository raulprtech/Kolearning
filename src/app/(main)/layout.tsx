import { Header } from '@/components/layout/Header';
import { UserProvider } from '@/context/UserContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </UserProvider>
  );
}
