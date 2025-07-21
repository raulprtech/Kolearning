
'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { evaluateOpenAnswer } from '@/ai/flows/evaluate-open-answer';
import type { EvaluateOpenAnswerInput } from '@/ai/flows/evaluate-open-answer';
import { generateOptionsForQuestion } from '@/ai/flows/generate-options-for-question';
import type { GenerateOptionsForQuestionInput } from '@/ai/flows/generate-options-for-question';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { Project, Flashcard as FlashcardType } from '@/types';

let createdProjects: Project[] = [];

const FlashcardSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
});

export async function handleGenerateProjectFromText(studyNotes: string) {
  if (!studyNotes) {
    return { error: 'Study notes cannot be empty.' };
  }

  try {
    const result = await generateDeckFromText({ studyNotes });
    
    // In a real app, you would save this to a database.
    // For now, we just return the result to be displayed on the client.
    return { project: result };

  } catch (error) {
    console.error('Error with project generation AI:', error);
    return { error: 'Sorry, I was unable to generate a project from your notes.' };
  }
}

export async function handleCreateProject(
    title: string, 
    description: string, 
    flashcards: z.infer<typeof FlashcardSchema>[]
) {
    if (!title || flashcards.length === 0) {
        return { error: 'Project must have a title and at least one flashcard.' };
    }

    const newProject: Project & { flashcards: FlashcardType[] } = {
        id: `gen-${Date.now()}`,
        title: title,
        description: description,
        category: 'Custom',
        author: 'User',
        size: flashcards.length,
        bibliography: [],
        flashcards: flashcards.map(fc => ({...fc, id: fc.id.toString(), deckId: `gen-${Date.now()}`}))
    };

    try {
        createdProjects.push(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        return { error: 'Sorry, I was unable to save the project.' };
    }
    
    redirect(`/proyecto/${newProject.id}/details`);
}


export async function getGeneratedProject(projectId: string) {
    const project = createdProjects.find(d => d.id === projectId);
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
