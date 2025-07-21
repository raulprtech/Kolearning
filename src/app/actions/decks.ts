'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { evaluateOpenAnswer } from '@/ai/flows/evaluate-open-answer';
import type { EvaluateOpenAnswerInput } from '@/ai/flows/evaluate-open-answer';
import { generateOptionsForQuestion } from '@/ai/flows/generate-options-for-question';
import type { GenerateOptionsForQuestionInput } from '@/ai/flows/generate-options-for-question';
import { redirect } from 'next/navigation';

let createdDecks: any[] = [];

export async function handleGenerateDeckFromText(formData: FormData) {
  const studyNotes = formData.get('studyNotes') as string;

  if (!studyNotes) {
    return { error: 'Study notes cannot be empty.' };
  }

  try {
    const result = await generateDeckFromText({ studyNotes });
    const newDeck = {
        id: `gen-${Date.now()}`,
        ...result,
        category: 'Generated',
        author: 'AI',
        size: result.flashcards.length,
        bibliography: ['Generated from user notes.'],
    };
    createdDecks.push(newDeck);
    
    // In a real app, you would save this to Firestore.
    // For now, we just redirect. The data will be available in-memory for this session.

  } catch (error) {
    console.error('Error with deck generation AI:', error);
    return { error: 'Sorry, I was unable to generate a deck from your notes.' };
  }
  
  redirect(`/deck/${createdDecks[createdDecks.length - 1].id}`);
}

export async function getGeneratedDeck(deckId: string) {
    return createdDecks.find(d => d.id === deckId) || null;
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
