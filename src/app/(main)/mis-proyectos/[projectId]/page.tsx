

// This is a server component that fetches data and passes it to the client component.
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAllProjects } from '@/app/actions/projects';
import { ProjectDetailsView } from '@/components/deck/ProjectDetailsView';
import { Skeleton } from '@/components/ui/skeleton';

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
