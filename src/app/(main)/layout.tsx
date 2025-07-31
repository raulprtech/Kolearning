import { Header } from '@/components/layout/Header';
import { UserProvider } from '@/context/UserContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          {data.user && <AppSidebar />}
          <main className="flex-1 w-full">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}