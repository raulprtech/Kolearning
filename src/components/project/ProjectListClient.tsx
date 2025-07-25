// src/components/project/ProjectListClient.tsx

'use client';

import { useState, useMemo } from 'react';
import { ProjectCard } from '@/components/deck/ProjectCard';
import { Input } from '@/components/ui/input';
import type { Project } from '@/types';

export function ProjectListClient({ initialProjects }: { initialProjects: Project[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchTerm) {
      return initialProjects;
    }
    return initialProjects.filter((project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, initialProjects]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Proyectos Públicos</h1>
      </div>
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Buscar proyectos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}
