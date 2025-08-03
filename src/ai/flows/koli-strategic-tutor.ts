'use server';
/**
 * @fileOverview Implements the AI Strategic Tutor flow, which analyzes FSRS data and performance history to dynamically adjust learning paths.
 *
 * - dynamicLearningPathAdjustment - Adjusts the learning path based on FSRS data and performance.
 * - DynamicLearningPathAdjustmentInput - The input type for the dynamicLearningPathAdjustment function.
 * - DynamicLearningPathAdjustmentOutput - The return type for the dynamicLearningPathAdjustment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DynamicLearningPathAdjustmentInputSchema = z.object({
  fsrsData: z.string().describe('The FSRS data including D, S, and R values for each atom.'),
  performanceHistory: z.string().describe('The performance history of the learner.'),
  currentLearningPath: z.string().describe('The current learning path of the learner.'),
});
export type DynamicLearningPathAdjustmentInput = z.infer<typeof DynamicLearningPathAdjustmentInputSchema>;

const DynamicLearningPathAdjustmentOutputSchema = z.object({
  adjustedLearningPath: z.string().describe('The adjusted learning path with suggestions for topics or Breach Detected sessions.'),
  reasoning: z.string().describe('The reasoning behind the adjusted learning path.'),
});
export type DynamicLearningPathAdjustmentOutput = z.infer<typeof DynamicLearningPathAdjustmentOutputSchema>;

export async function dynamicLearningPathAdjustment(input: DynamicLearningPathAdjustmentInput): Promise<DynamicLearningPathAdjustmentOutput> {
  return dynamicLearningPathAdjustmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicLearningPathAdjustmentPrompt',
  input: {schema: DynamicLearningPathAdjustmentInputSchema},
  output: {schema: DynamicLearningPathAdjustmentOutputSchema},
  prompt: `You are an AI Strategic Tutor named Koli, responsible for dynamically adjusting the learning path of a learner based on their FSRS data and performance history.

  Analyze the following information to identify weak areas and suggest specific topics or 'Breach Detected' sessions to reinforce those areas.

  FSRS Data: {{{fsrsData}}}
  Performance History: {{{performanceHistory}}}
  Current Learning Path: {{{currentLearningPath}}}

  Based on your analysis, provide an adjusted learning path with clear reasoning for the changes. Be concise and strategic.
  Make sure the response is easily parsable, and should contain only the adjustedLearningPath and reasoning field.
  `,
});

const dynamicLearningPathAdjustmentFlow = ai.defineFlow(
  {
    name: 'dynamicLearningPathAdjustmentFlow',
    inputSchema: DynamicLearningPathAdjustmentInputSchema,
    outputSchema: DynamicLearningPathAdjustmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
