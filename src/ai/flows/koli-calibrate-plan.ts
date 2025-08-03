// src/ai/flows/koli-calibrate-plan.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for calibrating a learning plan based on a user's pedagogical profile questionnaire.
 *
 * It includes:
 * - calibratePlanFromQuestionnaire - A function to trigger the learning plan calibration.
 * - CalibratePlanInput - The input type for the calibratePlanFromQuestionnaire function.
 * - CalibratePlanOutput - The return type for the calibratePlanFromQuestionnaire function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalibratePlanInputSchema = z.object({
  questionnaireResponses: z
    .string()
    .describe(
      'The responses to the pedagogical profile questionnaire.'
    ),
  learningMaterialSummary: z
    .string()
    .describe(
      'A summary of the learning material for context.'
    ),
});

export type CalibratePlanInput = z.infer<typeof CalibratePlanInputSchema>;

const CalibratePlanOutputSchema = z.object({
  revisedLearningPlan: z
    .string()
    .describe('The revised learning plan based on the questionnaire responses.'),
});

export type CalibratePlanOutput = z.infer<typeof CalibratePlanOutputSchema>;

export async function calibratePlanFromQuestionnaire(input: CalibratePlanInput): Promise<CalibratePlanOutput> {
  return calibratePlanFlow(input);
}

const calibratePlanPrompt = ai.definePrompt({
  name: 'calibratePlanPrompt',
  input: {schema: CalibratePlanInputSchema},
  output: {schema: CalibratePlanOutputSchema},
  prompt: `You are Koli, an AI Strategic Tutor, designed to create personalized learning plans.

  A learner has answered a pedagogical profile questionnaire. Based on their responses, and the provided summary of their learning material, revise their learning plan to better suit their needs and preferences.

  Questionnaire Responses: {{{questionnaireResponses}}}
  Learning Material Summary: {{{learningMaterialSummary}}}

  Provide a detailed and actionable revised learning plan.
  Format the revised learning plan with numbered steps.
  Consider the user's learning style, preferences, and goals when creating the plan.
  Be specific and avoid generic advice.
  Be concise. Keep the revised plan to a reasonable length.

  Revised Learning Plan:`, // Keep Revised Learning Plan at the end so that Gemini knows to complete it
});

const calibratePlanFlow = ai.defineFlow(
  {
    name: 'calibratePlanFlow',
    inputSchema: CalibratePlanInputSchema,
    outputSchema: CalibratePlanOutputSchema,
  },
  async input => {
    const {output} = await calibratePlanPrompt(input);
    return output!;
  }
);
