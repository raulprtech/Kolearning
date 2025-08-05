
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
  userObjective: z.string().describe("The user's learning objective."),
  deadline: z.string().optional().describe('The deadline the user has for their objective.'),
  masteryLevel: z.string().optional().describe('The self-reported mastery level of the user on the subject.'),
  learningMaterialSummary: z
    .string()
    .describe(
      'A summary of the learning material for context.'
    ),
});

export type CalibratePlanInput = z.infer<typeof CalibratePlanInputSchema>;

const CalibratePlanOutputSchema = z.object({
  projectTitle: z.string().describe('A creative and engaging title for the learning project.'),
  projectDescription: z.string().describe('A brief, one-sentence description of the project.'),
  categories: z.array(z.string()).describe('An array of one to three relevant categories for the project.'),
  learningPath: z.array(z.object({
      session: z.number().describe('The session number.'),
      topic: z.string().describe('What the user will learn in this session.'),
      sessionType: z.string().describe('The type of the session (e.g., Calibración, Incursión).')
  })).describe('The structured learning path with sessions.'),
  koliJustification: z.string().describe('The justification from Koli about the plan.'),
  expectedProgress: z.string().describe('The expected progress for the user.'),
  fullLearningPlanMarkdown: z.string().describe('The original full learning plan in Markdown format for storage.'),
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
Your response must be in Spanish.

A learner has provided their learning material, their objective, and some personal details. Based on all this information, create a comprehensive and strategic learning plan.

**Learner's Profile:**
- Learning Objective: {{{userObjective}}}
- Deadline: {{{deadline}}}
- Stated Mastery Level: {{{masteryLevel}}}

**Learning Material Summary:** 
{{{learningMaterialSummary}}}

**Kolearning Methodology & Rules:**

1.  **Session Size:** Each session MUST contain a MAXIMUM of 10 knowledge atoms (flashcards). This is a strict rule.
2.  **Sub-modules:** If the material is extensive, you MUST divide it into logical sub-modules or topics.
3.  **Session Types:**
    *   **Sesión de Calibración:**
        *   **Intention:** Diagnostic. Establish a baseline.
        *   **Content:** Use a small, representative sample of atoms from the entire material. This session should be short.
    *   **Sesión de Incursión:**
        *   **Intention:** Acquisition. Introduce NEW knowledge atoms (up to 10).
    *   **Sesión de Refuerzo de Dominio:**
        *   **Intention:** Long-term retention. Review previously seen atoms.
    *   **Sesión de Prueba de Dominio:**
        *   **Intention:** Certification. Test deep understanding of a sub-module. This should be the final session for a sub-module.

**Your Tasks:**

1.  **Generate Project Details:**
    *   **projectTitle:** Create a creative, engaging, and concise title for the learning project based on the material.
    *   **projectDescription:** Write a brief, one-sentence description summarizing the project's goal.
    *   **categories:** Assign 1 to 3 relevant categories (e.g., "Tecnología", "Ciencia", "Humanidades", "Arte").
2.  **Create the Learning Plan Components:**
    *   **learningPath:** Generate a structured array of learning sessions following all the rules above.
        *   Start with a "Calibración Inicial" session.
        *   For each sub-module, create a logical sequence of 'Incursión', 'Refuerzo', and 'Prueba de Dominio' sessions.
        *   Ensure no session has more than 10 atoms/topics.
        *   The 'topic' for each session should clearly state what will be learned.
    *   **koliJustification:** Provide a concise paragraph explaining the pedagogical strategy behind the plan (mentioning the short sessions and sub-modules).
    *   **expectedProgress:** Write an encouraging paragraph outlining the expected learning progression for the user.
    *   **fullLearningPlanMarkdown:** Generate a complete, actionable learning plan using Markdown for formatting. Use the generated 'projectTitle'. Structure the plan with the created sub-modules as main sections.

Provide the response in a structured JSON format.
`,
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
