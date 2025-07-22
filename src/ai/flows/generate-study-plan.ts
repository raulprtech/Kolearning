
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
  prompt: `You are an expert instructional designer named Koli. Your task is to create an efficient, personalized study plan in Spanish based on a user's goal, their study material, their available time, and their self-assessed knowledge level.

**User's Context:**
- **Objective:** "{{objective}}"
- **Project Title:** "{{projectTitle}}"
- **Time Limit:** "{{timeLimit}}"
- **Current Mastery Level:** "{{masteryLevel}}"

**Flashcards (Knowledge Atoms):**
{{#each flashcards}}
- **ID:** {{atomo_id}}
- **Concept:** {{concepto}}
- **Description:** {{descripcion}}
- **Prerequisites:** {{#if atomos_padre}}{{#each atomos_padre}}{{this}} {{/each}}{{else}}None{{/if}}
- **Difficulty:** {{dificultad_inicial}}
{{/each}}

**Your Task:**

1.  **Design a multi-session study plan.**
    -   Analyze the flashcards, their difficulties, and their dependencies ('atomos_padre') to create a logical sequence. Start with foundational concepts and build up to more complex ones.
    -   The plan can have **multiple sessions per day** if needed to meet the user's time limit.
    -   The total number of sessions should be between 5 and 15, depending on the complexity and volume of the material.
    -   Assign a session type to each topic from: 'Opción Múltiple', 'Respuesta Abierta', 'Tutor AI', 'Quiz de Repaso'. Use a variety of types. 'Tutor AI' is best for complex topics. 'Quiz de Repaso' is good for consolidation.
    -   Label sections clearly (e.g., "Día 1 - Sesión 1", "Día 1 - Sesión 2", "Día 2").

2.  **Write a brief, encouraging justification.**
    -   Explain the pedagogical reasoning behind your plan's structure, connecting it to the user's stated objective and time limit.

3.  **Provide an 'expectedProgress' explanation.**
    -   Briefly describe what the user is expected to have learned or accomplished after completing each major section or day of the plan. This sets clear expectations for their learning journey.

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
