
'use server';

/**
 * @fileOverview Generates a personalized study plan based on project details.
 *
 * - generateStudyPlan - Creates a structured learning path.
 */

import { ai } from '@/ai/genkit';
import { GenerateStudyPlanInputSchema, GenerateStudyPlanOutputSchema, type GenerateStudyPlanInput, type GenerateStudyPlanOutput } from '@/types';


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
