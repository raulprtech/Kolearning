// src/app/(main)/page.tsx

import { getAllProjects } from '@/app/actions/projects'; // Assuming this function exists to fetch user-specific projects
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getAuthSession } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getAuthSession();
  const allProjects = await getAllProjects();
  
  const myProjects = session 
    ? allProjects.filter(p => p.author === session.uid)
    : [];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardClient initialProjects={myProjects} />
    </main>
  );
}
