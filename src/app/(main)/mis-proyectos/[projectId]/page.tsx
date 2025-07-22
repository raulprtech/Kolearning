

import { notFound } from 'next/navigation';
import { getAllProjects } from '@/app/actions/projects';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectDetailsView } from '@/components/deck/ProjectDetailsView';


// This is a server component that fetches data and passes it to the client component.
export default async function ProjectDetailsPage({ params }: { params: { projectId: string }}) {
    const projectSlug = params.projectId;
    const allProjects = await getAllProjects();
    const project = allProjects.find(p => p.slug === projectSlug);

    if (!project) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ProjectDetailsView project={project} />
            </Suspense>
        </div>
    )
}
