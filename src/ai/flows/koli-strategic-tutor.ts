
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
  currentLearningPlan: z.string().describe('The current learning plan of the learner as a JSON string.'),
});
export type DynamicLearningPathAdjustmentInput = z.infer<typeof DynamicLearningPathAdjustmentInputSchema>;

const DynamicLearningPathAdjustmentOutputSchema = z.object({
  feedback: z.string().describe('A brief, encouraging feedback message for the user based on their performance.'),
  newSessions: z.array(z.object({
      type: z.string().describe('The type of the session (e.g., Refuerzo, Dominio).'),
      questions: z.string().describe('A brief description of the questions format (e.g., Opción múltiple, Preguntas abiertas).'),
      duration: z.string().describe('The estimated duration of the session (e.g., 20 min).')
  })).describe('An array of new sessions to be added to the learning plan. Can be empty if no adjustments are needed.'),
});
export type DynamicLearningPathAdjustmentOutput = z.infer<typeof DynamicLearningPathAdjustmentOutputSchema>;

export async function dynamicLearningPathAdjustment(input: DynamicLearningPathAdjustmentInput): Promise<DynamicLearningPathAdjustmentOutput> {
  return dynamicLearningPathAdjustmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicLearningPathAdjustmentPrompt',
  input: {schema: DynamicLearningPathAdjustmentInputSchema},
  output: {schema: DynamicLearningPathAdjustmentOutputSchema},
  prompt: `You are an AI Strategic Tutor named Koli. Your role is to provide feedback after a study session and dynamically adjust the learner's plan.
Your response must be in Spanish.

The user has just finished a study session. Analyze their performance and their current learning plan to decide if adjustments are needed.

**Your Tasks:**

1.  **Provide Feedback:** Write a short, encouraging, and insightful 'feedback' message (1-2 sentences). Comment on their effort or a specific area of improvement.
2.  **Adjust the Plan (If Necessary):**
    *   Analyze the user's performance ('performanceHistory', 'fsrsData') and their 'currentLearningPlan'.
    *   If you identify a weakness or an area that needs more focus, create one or two new 'newSessions' of type "Refuerzo" or "Dominio" to address it. These sessions should target the weak topics.
    *   If the user is doing well and no adjustments are needed, return an empty array for 'newSessions'.
    *   **IMPORTANT:** Only ADD new sessions. DO NOT modify or remove existing sessions from the plan.

**User Data:**

-   **FSRS Data:** {{{fsrsData}}}
-   **Performance History:** {{{performanceHistory}}}
-   **Current Learning Plan:** {{{currentLearningPlan}}}

Provide your response in the specified JSON format.
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
