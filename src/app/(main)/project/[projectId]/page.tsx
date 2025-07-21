
import type { Project, Flashcard } from '@/types';
import FlashcardViewer from './FlashcardViewer';
import { getGeneratedProject } from '@/app/actions/decks';

async function getProjectDetails(projectId: string): Promise<Project | null> {
  if (projectId.startsWith('gen-')) {
    const project = await getGeneratedProject(projectId);
    return project ? { ...project, flashcards: undefined } : null;
  }
  return null;
}

async function getFlashcards(projectId: string, project: Project | null): Promise<Flashcard[]> {
  // if it's a generated project, flashcards are part of the project object
  if (projectId.startsWith('gen-')) {
      const fullProject = await getGeneratedProject(projectId);
      return fullProject?.flashcards || [];
  }
  
  console.error(`Error fetching flashcards for project ${projectId}: Not found in mock data`);
  return [];
}

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const project = await getProjectDetails(projectId);
  const flashcards = await getFlashcards(projectId, project);

  if (!project) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="text-muted-foreground">The requested project does not exist.</p>
      </div>
    );
  }

  return <FlashcardViewer project={project} initialFlashcards={flashcards} />;
}
