
'use server';

/**
 * @fileOverview Provides study aids like hints or rephrased questions.
 *
 * - getStudyAid - A function that generates a study aid based on user request.
 * - StudyAidInput - The input type for the getStudyAid function.
 * - StudyAidOutput - The return type for the getStudyAid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const StudyAidInputSchema = z.object({
  aidType: z.enum(['hint', 'rephrase']).describe('The type of aid requested.'),
  question: z.string().describe('The question that was asked.'),
  answer: z.string().describe('The correct answer to the question (used for context, especially for hints).'),
});
export type StudyAidInput = z.infer<typeof StudyAidInputSchema>;

export const StudyAidOutputSchema = z.object({
  result: z.string().describe('The generated hint or rephrased question.'),
});
export type StudyAidOutput = z.infer<typeof StudyAidOutputSchema>;

export async function getStudyAid(input: StudyAidInput): Promise<StudyAidOutput> {
  return getStudyAidFlow(input);
}

const hintPrompt = ai.definePrompt({
    name: 'hintPrompt',
    input: { schema: StudyAidInputSchema },
    output: { schema: StudyAidOutputSchema },
    prompt: `You are Koli, an AI tutor. A learner has requested a hint for the following question.
Provide a concise, helpful hint that guides the learner toward the answer without giving it away directly.
All your responses must be in Spanish.

Question: {{{question}}}
Answer for your context: {{{answer}}}

Hint:`,
});

const rephrasePrompt = ai.definePrompt({
    name: 'rephrasePrompt',
    input: { schema: StudyAidInputSchema },
    output: { schema: StudyAidOutputSchema },
    prompt: `You are Koli, an AI tutor. A learner has requested that you rephrase the following question to make it easier to understand.
Ask the same question but using different words or from a different angle.
All your responses must be in Spanish.

Original Question: {{{question}}}

Rephrased Question:`,
});


const getStudyAidFlow = ai.defineFlow(
  {
    name: 'getStudyAidFlow',
    inputSchema: StudyAidInputSchema,
    outputSchema: StudyAidOutputSchema,
  },
  async (input) => {
    if (input.aidType === 'hint') {
      const { output } = await hintPrompt(input);
      return output!;
    } else {
      const { output } = await rephrasePrompt(input);
      return output!;
    }
  }
);
