
import type { Project, Flashcard } from '@/types';
import FlashcardViewer from './FlashcardViewer';
import { getGeneratedProject } from '@/app/actions/projects';

async function getProjectDetails(projectSlug: string): Promise<Project | null> {
  const project = await getGeneratedProject(projectSlug);
  return project ? { ...project, flashcards: undefined } : null;
}

async function getFlashcards(projectSlug: string): Promise<Flashcard[]> {
  const fullProject = await getGeneratedProject(projectSlug);
  return fullProject?.flashcards || [];
}

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const project = await getProjectDetails(projectId);
  const flashcards = await getFlashcards(projectId);

  if (!project) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>
        <p className="text-muted-foreground">El proyecto solicitado no existe.</p>
      </div>
    );
  }

  return <FlashcardViewer project={project} initialFlashcards={flashcards} />;
}
