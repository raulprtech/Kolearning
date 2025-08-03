
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
    projectTitle: z.string().describe('The title of the project.')
});

export type CalibratePlanInput = z.infer<typeof CalibratePlanInputSchema>;

const CalibratePlanOutputSchema = z.object({
  categories: z.array(z.string()).describe('An array of one to three relevant categories for the project.'),
  revisedLearningPlan: z
    .string()
    .describe('The revised learning plan based on the questionnaire responses, formatted in Markdown.'),
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

A learner has provided their learning material. Based on the material, create a comprehensive and strategic learning plan. The plan must follow the Kolearning methodology, structured into four types of sessions. Also, assign one to three relevant categories for this project.

Project Title: {{{projectTitle}}}
Questionnaire Responses: {{{questionnaireResponses}}}
Learning Material Summary: {{{learningMaterialSummary}}}

**Kolearning Methodology:**

1.  **Sesión de Calibración:**
    *   **Intención:** Diagnóstico. Establecer una línea base del conocimiento.
    *   **Evaluación:** Opción Múltiple.
    *   **Justificación:** Identificar fortalezas y debilidades.

2.  **Sesión de Incursión:**
    *   **Intención:** Adquisición. Presentar nuevos "Átomos de Conocimiento".
    *   **Evaluación:** Pregunta Abierta (Flashcard).
    *   **Justificación:** Maximizar el esfuerzo cognitivo para la recuperación activa.

3.  **Sesión de Refuerzo de Dominio:**
    *   **Intención:** Retención a Largo Plazo. Combatir la curva del olvido.
    *   **Evaluación:** Formatos Mixtos (Opción Múltiple, Ordenamiento, etc.).
    *   **Justificación:** Repetición espaciada para garantizar la retención.

4.  **Sesión de Prueba de Dominio:**
    *   **Intención:** Certificación. Evaluar el dominio profundo.
    *   **Evaluación:** Pregunta Abierta y Casos Prácticos.
    *   **Justificación:** Medir el resultado final del aprendizaje.

**Your Tasks:**

1.  **Assign Categories:** Based on the project title and material summary, provide 1 to 3 relevant categories (e.g., "Tecnología", "Ciencia", "Humanidades", "Arte").
2.  **Create the Learning Plan:**
    *   Generate a detailed, actionable learning plan using Markdown for formatting.
    *   Create a title for the plan like "Plan de Conquista para: {{{projectTitle}}}".
    *   Structure the plan with the four session types as the main sections (use Markdown headings).
    *   For each session type, briefly explain its purpose and suggest a concrete first step or focus area for the learner. For example, for "Sesión de Calibración," you might suggest "Comenzaremos con 15 preguntas de opción múltiple para evaluar tu conocimiento sobre los conceptos fundamentales."
    *   Keep the language encouraging, strategic, and concise.

Provide the response in JSON format containing 'categories' and 'revisedLearningPlan'.
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
