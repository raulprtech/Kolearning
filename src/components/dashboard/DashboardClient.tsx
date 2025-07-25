// src/components/dashboard/DashboardClient.tsx

'use client';

import { DashboardProjectCard } from '@/components/deck/DashboardProjectCard';
import { CreateProjectCard } from '@/components/project/CreateProjectCard';
import type { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export function DashboardClient({ initialProjects }: { initialProjects: Project[] }) {
  const nextSession = initialProjects.length > 0 ? `/aprender?project=${initialProjects[0].slug}&session=${initialProjects[0].completedSessions || 0}` : '/crear';

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Proyectos de Estudio</h1>
          <p className="text-muted-foreground">Continúa tu viaje de aprendizaje y crea nuevo material.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href={nextSession}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Aprender
                </Link>
            </Button>
            <Button asChild>
                <Link href="/crear">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Proyecto
                </Link>
            </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <CreateProjectCard />
        {initialProjects.map((project) => (
          <DashboardProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}
