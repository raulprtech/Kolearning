
'use server';

/**
 * @fileOverview Generates a personalized study plan based on project details.
 *
 * - generateStudyPlan - Creates a structured learning path.
 * - GenerateStudyPlanInput - The input type for the function.
 * - GenerateStudyPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FlashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const GenerateStudyPlanInputSchema = z.object({
  projectTitle: z.string().describe('The title of the study project.'),
  objective: z.string().describe('The user\'s learning goal (e.g., "pass an exam", "review for an interview").'),
  flashcards: z.array(FlashcardSchema).describe('The list of knowledge atoms (flashcards) for the project.'),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

export const GenerateStudyPlanOutputSchema = z.object({
  plan: z.array(z.object({
    section: z.string().describe("The section or day of the plan (e.g., 'Día 1', 'Semana 2', 'Conceptos Fundamentales')."),
    topic: z.string().describe('The specific topic or concept to be covered in this session.'),
    sessionType: z.string().describe("The recommended session type ('Opción Múltiple', 'Respuesta Abierta', 'Tutor AI', 'Quiz de Repaso')."),
  })).describe('A structured array representing the study plan, with 5 to 10 sessions.'),
  justification: z.string().describe('A brief, encouraging explanation of why the plan is structured this way to help the user achieve their goal.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: { schema: GenerateStudyPlanInputSchema },
  output: { schema: GenerateStudyPlanOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert instructional designer named Koli. Your task is to create an efficient, personalized study plan in Spanish based on a user's goal and their study material.

User's Goal: "{{objective}}"
Project Title: "{{projectTitle}}"

Flashcards (Knowledge Atoms):
{{#each flashcards}}
- Q: {{question}}
- A: {{answer}}
{{/each}}

Based on the goal and the flashcards, design a study plan with 5 to 10 sequential sessions.
- **Analyze the flashcards** to identify key themes and logical groupings.
- **Structure the plan** logically. Start with foundational concepts and build up to more complex ones.
- **Assign a session type** to each topic from the following options: 'Opción Múltiple', 'Respuesta Abierta', 'Tutor AI', 'Quiz de Repaso'. Use a variety of types. 'Tutor AI' is best for complex topics that may require deeper conversation. 'Quiz de Repaso' is good for consolidating knowledge.
- **Label sections** clearly (e.g., "Día 1", "Día 2" or "Conceptos Básicos", "Aplicaciones Avanzadas").
- **Write a brief, encouraging justification** in Spanish explaining the pedagogical reasoning behind your plan structure, connecting it to the user's stated objective.

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(GenerateStudyPlanOutputSchema.shape, null, 2)}
\`\`\`
`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
