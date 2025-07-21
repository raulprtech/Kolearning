
'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { refineProjectDetails } from '@/ai/flows/refine-project-details';
import { generateStudyPlan } from '@/ai/flows/generate-study-plan';
import { z } from 'zod';
import type { Project, Flashcard as FlashcardType, StudyPlan, ProjectDetails } from '@/types';
import { YoutubeTranscript } from 'youtube-transcript';
import { redirect } from 'next/navigation';

// In-memory store for created projects, pre-populated with initial data
let createdProjects: Project[] = [
    {
      id: '1',
      slug: 'javascript-fundamentals',
      title: 'JavaScript Fundamentals',
      description: 'Master the basics of JavaScript programming with essential concepts and syntax.',
      category: 'Programming',
      author: 'User',
      size: 20,
      bibliography: [],
      isPublic: false,
    },
    {
      id: '2',
      slug: 'react-essentials',
      title: 'React Essentials',
      description: 'Learn the core concepts of React including components, props, state, and hooks.',
      category: 'Programming',
      author: 'User',
      size: 25,
      bibliography: [],
      isPublic: false,
    },
    {
      id: '3',
      slug: 'web-development-basics',
      title: 'Web Development Basics',
      description: 'Fundamental concepts every web developer should know about HTML, CSS, and web technologies.',
      category: 'Web Development',
      author: 'User',
      size: 30,
      bibliography: [],
      isPublic: false,
    },
    {
      id: 'gen-12345',
      slug: 'plan-de-estudio-ia-tumores-renales',
      title: 'Plan de Estudio: IA para Segmentación de Tumores Renales',
      description: 'Plan de estudio para comprender el estado del arte en el uso de la Inteligencia Artificial para la segmentación de tumores renales, incluyendo aspectos multimodales, optimización y despliegue en hardware.',
      category: 'AI',
      author: 'Kolearning', // Public by default
      size: 15,
      bibliography: [],
      isPublic: true,
       flashcards: [
            { id: '1', deckId: 'gen-12345', question: '¿Qué es una IA multimodal?', answer: 'Una IA que puede procesar y relacionar información de múltiples tipos de datos, como texto, imágenes y sonido.' },
            { id: '2', deckId: 'gen-12345', question: 'Nombra un modelo de IA para segmentación de imágenes.', answer: 'U-Net es una arquitectura de red neuronal convolucional popular para la segmentación de imágenes biomédicas.' },
        ],
        studyPlan: {
            plan: [
                { section: "Día 1", topic: "Introducción a la IA", sessionType: "Opción Múltiple" },
                { section: "Día 2", topic: "Modelos de Segmentación", sessionType: "Tutor AI" },
                { section: "Día 3", topic: "Repaso General", sessionType: "Quiz de Repaso" },
            ],
            justification: "Este plan está diseñado para construir una base sólida antes de pasar a temas más complejos."
        }
    },
];

const FlashcardSchema = z.object({
  id: z.number().or(z.string()),
  question: z.string().min(1),
  answer: z.string().min(1),
  image: z.string().optional(),
});

const CreateProjectInputSchema = z.array(FlashcardSchema);

function createSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
      .trim()
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens
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

export async function handleRefineProjectDetails(input: { currentTitle: string, currentDescription: string, flashcards: FlashcardType[] }) {
    try {
        const result = await refineProjectDetails(input);
        return { details: result };
    } catch (error) {
        console.error('Error refining project details:', error);
        return { error: 'Sorry, I was unable to refine the project details.' };
    }
}

export async function handleGenerateStudyPlan(input: { projectTitle: string, objective: string, flashcards: FlashcardType[] }) {
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
    flashcards: Omit<FlashcardType, 'deckId'>[],
    studyPlan: StudyPlan
) {
    const safeFlashcards = flashcards.map(fc => ({...fc, id: fc.id || Date.now()}));
    const validation = CreateProjectInputSchema.safeParse(safeFlashcards);
    
    if (!validation.success) {
        console.error("Invalid flashcard data:", validation.error.flatten());
        return { error: 'Invalid flashcard data provided.' };
    }

    if (!projectDetails.title || validation.data.length === 0) {
        return { error: 'Project must have a title and at least one flashcard.' };
    }
    
    const slug = createSlug(projectDetails.title);

    const newProject: Project = {
        id: `gen-${Date.now()}`,
        slug: slug,
        title: projectDetails.title,
        description: projectDetails.description,
        category: projectDetails.category || 'General',
        author: 'User',
        size: validation.data.length,
        bibliography: [],
        flashcards: validation.data.map(fc => ({...fc, id: fc.id.toString(), deckId: `gen-${Date.now()}`})),
        studyPlan: studyPlan,
        isPublic: projectDetails.isPublic,
    };

    try {
        createdProjects.push(newProject);
        return { project: newProject };
    } catch (error) {
        console.error('Error creating project:', error);
        return { error: 'Sorry, I was unable to save the project.' };
    }
}


export async function getGeneratedProject(projectSlug: string) {
    const project = createdProjects.find(d => d.slug === projectSlug);
    if (project) {
        return project;
    }
    return null;
}

export async function getAllProjects() {
    return createdProjects;
}
