// src/components/dashboard/DashboardClient.tsx

'use client';

import { DashboardProjectCard } from '@/components/deck/DashboardProjectCard';
import { CreateProjectCard } from '@/components/project/CreateProjectCard';
import type { Project } from '@/types';

export function DashboardClient({ initialProjects }: { initialProjects: Project[] }) {
  // Aquí puedes agregar la lógica de estado que necesites en el futuro.
  // Por ahora, solo muestra los proyectos que recibe.

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <CreateProjectCard />
      {initialProjects.map((project) => (
        <DashboardProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
