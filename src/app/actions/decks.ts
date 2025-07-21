
'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { evaluateOpenAnswer } from '@/ai/flows/evaluate-open-answer';
import type { EvaluateOpenAnswerInput } from '@/ai/flows/evaluate-open-answer';
import { generateOptionsForQuestion } from '@/ai/flows/generate-options-for-question';
import type { GenerateOptionsForQuestionInput } from '@/ai/flows/generate-options-for-question';
import { redirect } from 'next/navigation';
import { z } from 'zod';

let createdDecks: any[] = [];

// Helper Zod schema for flashcards to be passed to the action
const FlashcardSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
});

export async function handleGenerateDeckFromText(studyNotes: string) {
  if (!studyNotes) {
    return { error: 'Study notes cannot be empty.' };
  }

  try {
    const result = await generateDeckFromText({ studyNotes });
    
    // In a real app, you would save this to a database.
    // For now, we just return the result to be displayed on the client.
    return { deck: result };

  } catch (error) {
    console.error('Error with deck generation AI:', error);
    return { error: 'Sorry, I was unable to generate a deck from your notes.' };
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

    const newDeck = {
        id: `gen-${Date.now()}`,
        title: title,
        description: description,
        category: 'Custom',
        author: 'User',
        size: flashcards.length,
        bibliography: [],
        flashcards: flashcards.map(fc => ({...fc, id: fc.id.toString()}))
    };

    try {
        // In a real app, this would be a database write operation.
        // We keep the try...catch in case we add database logic later.
        createdDecks.push(newDeck);
    } catch (error) {
        console.error('Error creating project:', error);
        return { error: 'Sorry, I was unable to save the learning plan.' };
    }
    
    // Redirect must happen outside the try...catch block
    redirect(`/deck/${newDeck.id}/details`);
}


export async function getGeneratedDeck(deckId: string) {
    // This is a temporary solution for a mock database.
    const deck = createdDecks.find(d => d.id === deckId);
    if (deck) {
        // The flashcards are already in the correct format in the simplified handleCreateProject
        return deck;
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
