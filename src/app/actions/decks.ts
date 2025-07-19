'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
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
