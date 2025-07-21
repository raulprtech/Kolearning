'use server';

import { generateDeckFromText } from '@/ai/flows/generate-deck-from-text';
import { evaluateOpenAnswer } from '@/ai/flows/evaluate-open-answer';
import type { EvaluateOpenAnswerInput } from '@/ai/flows/evaluate-open-answer';
import { generateOptionsForQuestion } from '@/ai/flows/generate-options-for-question';
import type { GenerateOptionsForQuestionInput } from '@/ai/flows/generate-options-for-question';
import { generateLearningPlan } from '@/ai/flows/generate-learning-plan';
import { redirect } from 'next/navigation';

let createdDecks: any[] = [];

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
    flashcards: { question: string, answer: string }[]
) {
    if (!title || flashcards.length === 0) {
        return { error: 'Project must have a title and at least one flashcard.' };
    }

    try {
        const plan = await generateLearningPlan({ title, flashcards });

        // In a real app, this would be saved to a database.
        // For now, we store it in memory for this session.
        const newDeck = {
            id: `gen-${Date.now()}`,
            title: plan.title,
            description: plan.description,
            category: plan.category,
            author: 'AI',
            size: plan.questions.length,
            bibliography: plan.bibliography || [],
            // The questions would be stored as a subcollection in a real app
            questions: plan.questions 
        };
        createdDecks.push(newDeck);

        // Redirect to the newly created deck's detail page
        redirect(`/deck/${newDeck.id}/details`);

    } catch (error) {
        console.error('Error creating learning plan:', error);
        return { error: 'Sorry, I was unable to create a learning plan.' };
    }
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
