
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
      day: z.number().describe("The day number, starting from 1."),
      sessions: z.array(z.object({
        session: z.number().describe('The overall session number (1, 2, 3...).'),
        topic: z.string().describe('What the user will learn in this session.'),
        sessionType: z.string().describe('The type of the session (e.g., Calibración, Incursión).'),
        questions: z.string().describe('The format of the questions for this session (e.g., "Opción Múltiple", "Preguntas Abiertas").')
      })).describe("An array of sessions for this specific day.")
  })).describe('The structured learning path with sessions grouped by day.'),
  koliJustification: z.string().describe('The justification from Koli about the plan, explaining the daily structure if applicable.'),
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

1.  **Daily Structure:** If the user provides a deadline, you MUST structure the learning plan by days. Group the sessions within each day. Your 'learningPath' output should be an array of day objects. Explain in your 'koliJustification' why you've grouped certain sessions on the same day (e.g., "Para el Día 1, he combinado una sesión de Incursión para introducir nuevos conceptos con una de Refuerzo para consolidar lo aprendido ayer, optimizando tu tiempo.").
2.  **Session Numbering:** The 'session' field for each learning path item MUST be a simple, sequential integer (1, 2, 3, 4, ...), even when grouped by day. This is a critical rule.
3.  **Session Size:** Each session MUST contain a MAXIMUM of 10 knowledge atoms (flashcards).
4.  **Sub-modules:** If the material is extensive, you MUST divide it into logical sub-modules or topics. Reflect these topics in the 'topic' field.
5.  **Session Types & Question Formats:** You MUST assign the correct question format to each session type as defined below. This is a critical rule.

    *   'Calibración'
        *   **Intention:** Diagnostic. Establish a baseline.
        *   **Question Format ('questions' field):** "Opción Múltiple".
        *   **Content:** A small, representative sample of atoms.

    *   'Incursión'
        *   **Intention:** Acquisition. Introduce NEW knowledge.
        *   **Question Format ('questions' field):** "Pregunta Abierta".
        *   **Content:** Up to 10 new atoms.

    *   'Refuerzo de Dominio'
        *   **Intention:** Long-term retention.
        *   **Question Format ('questions' field):** "Formatos Mixtos (Opción Múltiple, Ordenamiento, Asociación)".
        *   **Content:** Atoms selected by an FSRS algorithm.

    *   'Prueba de Dominio'
        *   **Intention:** Certification. Test deep understanding.
        *   **Question Format ('questions' field):** "Pregunta Abierta y Casos Prácticos".
        *   **Content:** All atoms related to a sub-module.


**Your Tasks:**

1.  **Generate Project Details:**
    *   **projectTitle, projectDescription, categories:** Create these as before.
2.  **Create the Learning Plan Components:**
    *   **learningPath:** Generate a structured array of *day objects*. Each day object contains the sessions for that day.
        *   Start with a "Calibración" session on Day 1.
        *   Distribute 'Incursión', 'Refuerzo', and 'Prueba de Dominio' sessions logically across the available days to meet the deadline. If the user has an 'Avanzado' mastery level, you can schedule more sessions per day.
        *   **CRUCIAL RULE:** The 'session' numbers inside the session objects MUST remain sequential integers (1, 2, 3...).
        *   **CRUCIAL RULE:** For each session object, you MUST populate the 'questions' field with the exact corresponding string value based on the 'sessionType' field.
    *   **koliJustification:** Provide a concise paragraph explaining the pedagogical strategy, *especially the daily distribution of sessions*.
    *   **expectedProgress:** Write an encouraging paragraph about the expected learning progression.
    *   **fullLearningPlanMarkdown:** Generate a complete learning plan using Markdown.

Provide the response in the specified JSON format.
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
