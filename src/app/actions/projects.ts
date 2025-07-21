
'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { evaluateOpenAnswer } from '@/ai/flows/evaluate-open-answer';
import type { EvaluateOpenAnswerInput } from '@/ai/flows/evaluate-open-answer';
import { generateOptionsForQuestion } from '@/ai/flows/generate-options-for-question';
import type { GenerateOptionsForQuestionInput } from '@/ai/flows/generate-options-for-question';
import { z } from 'zod';
import type { Project, Flashcard as FlashcardType } from '@/types';
import { YoutubeTranscript } from 'youtube-transcript';

// In-memory store for created projects
let createdProjects: Project[] = [];

const FlashcardSchema = z.object({
  id: z.number(),
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
    return rows.map(row => {
        const parts = row.split(termSep);
        return {
            question: parts[0] || '',
            answer: parts.slice(1).join(termSep) || ''
        };
    }).filter(card => card.question);
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

export async function handleCreateProject(
    title: string, 
    description: string, 
    category: string,
    flashcards: z.infer<typeof CreateProjectInputSchema>
) {
    const validation = CreateProjectInputSchema.safeParse(flashcards);
    if (!validation.success) {
        console.error("Invalid flashcard data:", validation.error.flatten());
        return { error: 'Invalid flashcard data provided.' };
    }

    if (!title || flashcards.length === 0) {
        return { error: 'Project must have a title and at least one flashcard.' };
    }
    
    const slug = createSlug(title);

    const newProject: Project & { flashcards: FlashcardType[] } = {
        id: `gen-${Date.now()}`,
        slug: slug,
        title: title,
        description: description,
        category: category || 'General',
        author: 'User',
        size: flashcards.length,
        bibliography: [],
        flashcards: flashcards.map(fc => ({...fc, id: fc.id.toString(), deckId: `gen-${Date.now()}`}))
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

export async function handleEvaluateOpenAnswer(input: EvaluateOpenAnswerInput) {
  try {
    const evaluation = await evaluateOpenAnswer(input);
    return { evaluation };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return { error: 'Sorry, I was unable to evaluate your answer.' };
  }
}

export async function handleGenerateOptionsForQuestion(input: GenerateOptionsForQuestionInput) {
    try {
        const result = await generateOptionsForQuestion(input);
        return { options: result.options };
    } catch (error) {
        console.error('Error generating options:', error);
        return { error: 'Sorry, I was unable to generate options for this question.' };
    }
}
