
// src/ai/flows/koli-calibrate-plan.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for calibrating a learning plan.
 *
 * It includes:
 * - calibratePlanFromQuestionnaire - A function to trigger the learning plan calibration.
 * - CalibratePlanInput - The input type for the calibratePlanfromQuestionnaire function.
 * - CalibratePlanOutput - The return type for the calibratePlanFromQuestionnaire function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AtomSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const CalibratePlanInputSchema = z.object({
  atoms: z.array(AtomSchema).describe('The complete list of knowledge atoms generated from the material.'),
  projectTitle: z.string().describe('The title for the learning project provided by the user.'),
});

export type CalibratePlanInput = z.infer<typeof CalibratePlanInputSchema>;

const CalibratePlanOutputSchema = z.object({
  projectDescription: z.string().describe('A brief, one-sentence description of the project.'),
  categories: z.array(z.string()).describe('An array of one to three relevant categories for the project.'),
  learningPath: z.array(z.object({
      day: z.number().describe("The day number, starting from 1."),
      sessions: z.array(z.object({
        session: z.number().describe('The overall session number (1, 2, 3...).'),
        topic: z.string().describe('What the user will learn in this session.'),
        sessionType: z.string().describe('The type of the session (e.g., Calibración, Incursión).'),
        questions: z.string().describe('The format of the questions for this session (e.g., "Opción Múltiple", "Preguntas Abiertas").'),
        atoms: z.array(AtomSchema).describe('The specific atoms assigned to this session.'),
        numAtoms: z.number().describe('The optimal number of knowledge atoms for this session, based on the topic complexity and pedagogical goals. Should be between 5 and 20.')
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
  input: { schema: CalibratePlanInputSchema },
  output: {schema: CalibratePlanOutputSchema},
  prompt: `You are Koli, an AI Strategic Tutor, designed to create personalized learning plans based on a deep pedagogical framework.
Your response must be in Spanish.

A learner has provided their learning material, which has been converted into "Knowledge Atoms", and has given their project a title.

**Project Title:** {{{projectTitle}}}

**Your Tasks:**

1.  **Analyze and Define the Project:**
    *   **Analyze the content:** Carefully review the provided 'atoms' to understand the core subject matter.
    *   **Generate 'projectDescription', and 'categories':** Based on your analysis of the atoms and respecting the user's chosen title, create a concise one-sentence description, and one to three appropriate categories for the learning project.

2.  **Create the Learning Plan Components:**
    *   **learningPath:** Generate a structured array of *day objects*. Each day object contains the sessions for that day.
        *   Start with a "Calibración" session on Day 1.
        *   Distribute 'Incursión', 'Refuerzo', and 'Prueba de Dominio' sessions logically across the days.
        *   **CRUCIAL RULE:** The 'session' numbers inside the session objects MUST remain sequential integers (1, 2, 3...).
        *   **CRUCIAL RULE:** For each session object, you MUST populate the 'questions' field with the exact corresponding string value based on the 'sessionType' field.
    *   **koliJustification:** Provide a concise paragraph explaining the pedagogical strategy, *especially the daily distribution of sessions*.
    *   **expectedProgress:** Write an encouraging paragraph about the expected learning progression.
    *   **fullLearningPlanMarkdown:** Generate a complete learning plan using Markdown.


**Knowledge Atoms:** {{{atoms}}}

**Kolearning Methodology & Strict Rules:**

1.  **Structure:** You MUST structure the learning plan logically. Group the sessions into a reasonable number of days (e.g., 3-7 days for moderately sized topics). Your 'learningPath' output should be an array of day objects. Explain in your 'koliJustification' why you've grouped certain sessions on the same day (e.g., "Para el Día 1, he combinado una sesión de Incursión para introducir nuevos conceptos con una de Refuerzo para consolidar lo aprendido, optimizando tu tiempo.").
2.  **Session Numbering:** The 'session' field for each learning path item MUST be a simple, sequential integer (1, 2, 3, 4, ...), even when grouped by day. This is a critical rule.
3.  **Session Size:** You MUST decide the optimal number of knowledge atoms ('numAtoms') for each session. This should be based on the session's purpose and the topic's complexity (e.g., a 'Calibración' might have 5-7 atoms, while an 'Incursión' into a dense topic could have 15-20). The number should be between 5 and 20. You must then select that number of atoms from the general pool and assign them to the 'atoms' field for that session.
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

Provide the response in the specified JSON format.
`,
});

const calibratePlanFlow = ai.defineFlow(
  {
    name: 'calibratePlanFlow',
    inputSchema: CalibratePlanInputSchema,
    outputSchema: CalibratePlanOutputSchema,
  },
  async (input) => {
    const { output } = await calibratePlanPrompt(input);
    return output!;
  }
);
