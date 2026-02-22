'use server';
/**
 * @fileOverview Provides study aids like hints or rephrased questions.
 *
 * - getStudyAid - A function that generates a study aid based on user request.
 * - StudyAidInput - The input type for the getStudyAid function.
 * - StudyAidOutput - The return type for the getStudyAid function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const StudyAidInputSchema = z.object({
    aidType: z.enum(['hint', 'rephrase']).describe('The type of aid requested.'),
    question: z.string().describe('The question that was asked.'),
    answer: z.string().describe('The correct answer to the question (used for context, especially for hints).'),
});
const StudyAidOutputSchema = z.object({
    result: z.string().describe('The generated hint or rephrased question.'),
});
export async function getStudyAid(input) {
    return getStudyAidFlow(input);
}
const hintPrompt = ai.definePrompt({
    name: 'hintPrompt',
    input: { schema: StudyAidInputSchema },
    output: { schema: StudyAidOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.1,
        maxOutputTokens: 8192
    },
    prompt: `You are the Learning Box Tutor, an expert AI tutor. A learner has requested a hint for the following question.
Provide a concise, helpful hint that guides the learner toward the answer without giving it away directly.
All your responses must be in English.

Question: {{{question}}}
Answer for your context: {{{answer}}}

Hint:`,
});
const rephrasePrompt = ai.definePrompt({
    name: 'rephrasePrompt',
    input: { schema: StudyAidInputSchema },
    output: { schema: StudyAidOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.1,
        maxOutputTokens: 8192
    },
    prompt: `You are the Learning Box Tutor, an expert AI tutor. A learner has requested that you rephrase the following question to make it easier to understand.
Ask the same question but using different words or from a different angle.
All your responses must be in English.

Original Question: {{{question}}}

Rephrased Question:`,
});
const getStudyAidFlow = ai.defineFlow({
    name: 'getStudyAidFlow',
    inputSchema: StudyAidInputSchema,
    outputSchema: StudyAidOutputSchema,
}, async (input) => {
    if (input.aidType === 'hint') {
        const { output } = await hintPrompt(input);
        return output;
    }
    else {
        const { output } = await rephrasePrompt(input);
        return output;
    }
});
