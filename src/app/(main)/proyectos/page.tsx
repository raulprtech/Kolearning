// src/app/(main)/proyectos/page.tsx

import { getAllProjects } from '@/app/actions/projects';
import { ProjectListClient } from '@/components/project/ProjectListClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <ProjectListClient initialProjects={projects} />
    </main>
  );
}
