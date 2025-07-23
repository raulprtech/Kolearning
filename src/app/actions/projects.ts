'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { refineProjectDetails } from '@/ai/flows/refine-project-details';
import { generateStudyPlan } from '@/ai/flows/generate-study-plan';
import { refineStudyPlan } from '@/ai/flows/refine-study-plan';
import { z } from 'zod';
import type { Project, Flashcard as FlashcardType, StudyPlan, ProjectDetails, RefineProjectDetailsInput, GenerateStudyPlanInput, SessionPerformanceSummary } from '@/types';
import { YoutubeTranscript } from 'youtube-transcript';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

const CreateProjectInputSchema = z.array(z.object({
  id: z.string(),
  deckId: z.string(),
  question: z.string(),
  answer: z.string(),
  atomo_id: z.string(),
  material_id: z.string(),
  concepto: z.string(),
  descripcion: z.string(),
  atomos_padre: z.array(z.string()),
  formatos_presentacion: z.array(z.string()),
  dificultad_inicial: z.string(),
  image: z.string().optional(),
}));

function createSlug(title: string) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
  
    return title.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
}

export async function handleGenerateProjectFromPdf(pdfDataUri: string, fileName: string) {
  if (!pdfDataUri) {
    return { error: 'PDF data cannot be empty.' };
  }
  
  try {
    const result = await generateDeckFromText({ studyNotes: pdfDataUri });
    return { project: result };
  } catch (error) {
    console.error('Error with PDF project generation:', error);
    return { error: 'Sorry, I was unable to generate a project from your PDF.' };
  }
}

export async function handleGenerateProjectFromImages(imageDataUris: string[]) {
    if (!imageDataUris || imageDataUris.length === 0) {
        return { error: 'No images provided.' };
    }
    try {
        const result = await generateDeckFromText({ studyNotes: imageDataUris });
        return { project: result };
    } catch (error) {
        console.error('Error with multi-image project generation:', error);
        return { error: 'Sorry, I was unable to generate a project from your images.' };
    }
}

export async function handleGenerateProjectFromText(studyNotes: string) {
  if (!studyNotes) {
    return { error: 'Study notes cannot be empty.' };
  }

  try {
    const result = await generateDeckFromText({ studyNotes });
    return { project: result };

  } catch (error) {
    console.error('Error with project generation AI:', error);
    return { error: 'Sorry, I was unable to generate a project from your notes.' };
  }
}

export async function handlePastedTextImport(
    pastedText: string,
    termSeparator: string,
    rowSeparator: string,
    customTermSeparator?: string,
    customRowSeparator?: string
) {
    const getSeparator = (type: 'term' | 'row') => {
        if (type === 'term') {
            if (termSeparator === 'tab') return '\t';
            if (termSeparator === 'comma') return ',';
            return customTermSeparator || '\t';
        }
        if (rowSeparator === 'newline') return '\n';
        if (rowSeparator === 'semicolon') return ';';
        return (customRowSeparator || '\n').replace(/\\n/g, '\n');
    };

    const rowSep = getSeparator('row');
    const termSep = getSeparator('term');

    const rows = pastedText.split(rowSep).filter(row => row.trim() !== '');
    const parsedCards = rows.map(row => {
        const parts = row.split(termSep);
        return {
            question: parts[0] || '',
            answer: parts.slice(1).join(termSep) || ''
        };
    }).filter(card => card.question);
    
    return parsedCards;
};

export async function handleGenerateProjectFromYouTubeUrl(videoUrl: string) {
  if (!videoUrl) {
    return { error: 'YouTube URL cannot be empty.' };
  }

  try {
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoUrl);
    if (!transcriptResponse || transcriptResponse.length === 0) {
      return { error: 'Could not fetch transcript for this video. It might be disabled or private.' };
    }

    const studyNotes = transcriptResponse.map(item => item.text).join(' ');
    
    const result = await generateDeckFromText({ studyNotes });
    return { project: result };

  } catch (error) {
    console.error('Error with YouTube project generation:', error);
    return { error: 'This video ID is invalid or the video has no transcript.' };
  }
}

export async function handleGenerateProjectFromWebUrl(webUrl: string) {
  if (!webUrl) {
    return { error: 'Web page URL cannot be empty.' };
  }

  try {
    const response = await fetch(webUrl);
    if (!response.ok) {
      return { error: `Could not fetch content from the URL. Status: ${response.status}` };
    }
    const htmlContent = await response.text();
    const result = await generateDeckFromText({ studyNotes: htmlContent });
    return { project: result };

  } catch (error) {
    console.error('Error with web page project generation:', error);
    return { error: 'Could not process the web page. Please check the URL and try again.' };
  }
}

export async function handleRefineProjectDetails(input: RefineProjectDetailsInput) {
    try {
        const result = await refineProjectDetails(input);
        return { details: result };
    } catch (error) {
        console.error('Error refining project details:', error);
        return { error: 'Sorry, I was unable to refine the project details.' };
    }
}

export async function handleGenerateStudyPlan(input: GenerateStudyPlanInput) {
    try {
        const result = await generateStudyPlan(input);
        return { plan: result };
    } catch (error) {
        console.error('Error generating study plan:', error);
        return { error: 'Sorry, I was unable to generate a study plan.' };
    }
}


export async function handleCreateProject(
    projectDetails: ProjectDetails,
    flashcards: FlashcardType[],
    studyPlan: StudyPlan
) {
    const session = await getAuthSession();
    if (!session) {
        throw new Error('Unauthorized');
    }

    if (!projectDetails.title || flashcards.length === 0) {
        throw new Error('Project must have a title and at least one flashcard.');
    }
    
    const newProjectId = uuidv4();
    const titleSlug = createSlug(projectDetails.title);
    const slug = `${titleSlug}-${newProjectId.slice(0, 8)}`;

    const processedFlashcards = flashcards.map(fc => ({
      ...fc,
      id: fc.id || fc.atomo_id || uuidv4(),
      deckId: newProjectId
    }));

    const validation = CreateProjectInputSchema.safeParse(processedFlashcards);
    
    if (!validation.success) {
        console.error("Invalid flashcard data:", validation.error.flatten());
        throw new Error('Invalid flashcard data provided.');
    }

    const newProject: Project = {
        id: newProjectId,
        slug: slug,
        title: projectDetails.title,
        description: projectDetails.description,
        category: projectDetails.category || 'General',
        author: session.uid, // Set author to the current user's UID
        size: validation.data.length,
        bibliography: [],
        flashcards: validation.data,
        studyPlan: studyPlan,
        isPublic: projectDetails.isPublic,
        completedSessions: 0,
    };

    try {
        await adminDb.collection('projects').doc(newProjectId).set(newProject);
    } catch(error) {
        console.error("Error creating project in Firestore:", error);
        throw new Error("Could not save project to the database.");
    }
    
    redirect(`/mis-proyectos/${newProject.slug}`);
}

export async function handleEndSessionAndRefinePlan(projectSlug: string, completedSessionIndex: number, performanceSummary: SessionPerformanceSummary) {
    const session = await getAuthSession();
    if (!session) {
        return { error: 'Unauthorized' };
    }
    
    const projectQuery = await adminDb.collection('projects').where('slug', '==', projectSlug).limit(1).get();
    if (projectQuery.empty) {
        return { error: 'Project not found.' };
    }
    const projectDoc = projectQuery.docs[0];
    const project = projectDoc.data() as Project;
    const projectRef = projectDoc.ref;

    // Update completed sessions
    const currentCompleted = project.completedSessions || 0;
    if (completedSessionIndex + 1 > currentCompleted) {
        await projectRef.update({ completedSessions: completedSessionIndex + 1 });
    }
    
    if (!project.studyPlan) {
        return { success: true, planUpdated: false, reasoning: 'No study plan to refine.' };
    }

    const currentPlan = project.studyPlan.plan;

    try {
        const result = await refineStudyPlan({
            currentPlan,
            completedSessionIndex,
            performanceSummary,
        });

        let planUpdated = false;
        if (result.needsChange && result.updatedPlan) {
            await projectRef.update({ 'studyPlan.plan': result.updatedPlan });
            planUpdated = true;
        }

        return {
            success: true,
            planUpdated,
            reasoning: result.reasoning,
        };

    } catch (error) {
        console.error('Error refining study plan:', error);
        return { error: 'Sorry, I was unable to refine the study plan.' };
    }
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const projectsSnapshot = await adminDb.collection('projects').get();
    if (projectsSnapshot.empty) {
      return [];
    }
    return projectsSnapshot.docs.map(doc => doc.data() as Project);
  } catch (error) {
    console.error("Error fetching all projects:", error);
    return [];
  }
}
