
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
      sessionType: z.string().describe('The type of the session (e.g., Calibración, Incursión).'),
      questions: z.string().describe('The format of the questions for this session (e.g., "Opción Múltiple", "Preguntas Abiertas").')
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
  prompt: `You are Koli, an AI Strategic Tutor, designed to create personalized learning plans based on a deep pedagogical framework.
Your response must be in Spanish.

A learner has provided their learning material, their objective, and some personal details. Based on all this information, create a comprehensive and strategic learning plan.

**Learner's Profile:**
- Learning Objective: {{{userObjective}}}
- Deadline: {{{deadline}}}
- Stated Mastery Level: {{{masteryLevel}}}

**Learning Material Summary:** 
{{{learningMaterialSummary}}}

**Kolearning Methodology & Strict Rules:**

1.  **Session Size:** Each session MUST contain a MAXIMUM of 10 knowledge atoms (flashcards).
2.  **Sub-modules:** If the material is extensive, you MUST divide it into logical sub-modules or topics.
3.  **Session Types & Question Formats:** You MUST assign the correct question format to each session type as defined below. This is a critical rule.

    *   'Calibración'
        *   **Intention:** Diagnostic. Establish a baseline.
        *   **Question Format ('questions' field):** "Opción Múltiple". This allows for a quick assessment of concept recognition.
        *   **Content:** Use a small, representative sample of atoms from the entire material. This session should be short.

    *   'Incursión'
        *   **Intention:** Acquisition. Introduce NEW knowledge atoms.
        *   **Question Format ('questions' field):** "Pregunta Abierta". Maximizes cognitive effort for strong initial memory encoding (Active Recall).
        *   **Content:** Up to 10 new atoms.

    *   'Refuerzo de Dominio'
        *   **Intention:** Long-term retention. Combat the forgetting curve.
        *   **Question Format ('questions' field):** "Formatos Mixtos". Use a mix of question types to reinforce knowledge from different angles.
        *   **Content:** Atoms selected by the FSRS algorithm for review.

    *   'Prueba de Dominio'
        *   **Intention:** Certification. Test deep, applicable understanding of a sub-module.
        *   **Question Format ('questions' field):** "Pregunta Abierta y Casos Prácticos". The most demanding format to validate mastery.
        *   **Content:** All atoms related to a specific sub-module. This should be the final session for that sub-module.


**Your Tasks:**

1.  **Generate Project Details:**
    *   **projectTitle:** Create a creative, engaging, and concise title for the learning project.
    *   **projectDescription:** Write a brief, one-sentence description summarizing the project's goal.
    *   **categories:** Assign 1 to 3 relevant categories (e.g., "Tecnología", "Ciencia", "Humanidades", "Arte").
2.  **Create the Learning Plan Components:**
    *   **learningPath:** Generate a structured array of learning sessions.
        *   Start with a "Calibración" session.
        *   For each sub-module, create a logical sequence of 'Incursión', 'Refuerzo de Dominio', and 'Prueba de Dominio' sessions.
        *   The 'topic' for each session should clearly state what will be learned.
        *   **CRUCIAL RULE: For each session object in the 'learningPath' array, you MUST populate the 'questions' field with the exact corresponding string value based on the 'sessionType' field. Follow these mappings strictly:
          - If sessionType is 'Calibración', questions MUST BE 'Opción Múltiple'.
          - If sessionType is 'Incursión', questions MUST BE 'Pregunta Abierta'.
          - If sessionType is 'Refuerzo de Dominio', questions MUST BE 'Formatos Mixtos'.
          - If sessionType is 'Prueba de Dominio', questions MUST BE 'Pregunta Abierta y Casos Prácticos'.
          DO NOT DEVIATE FROM THIS MAPPING.**
    *   **koliJustification:** Provide a concise paragraph explaining the pedagogical strategy.
    *   **expectedProgress:** Write an encouraging paragraph about the expected learning progression.
    *   **fullLearningPlanMarkdown:** Generate a complete learning plan using Markdown.

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
