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

**Core Pedagogical Principles:**
Your plan MUST be based on the principles of **spaced repetition, active recall, and scaffolding**.
-   **No one-session mastery:** Do not expect the user to master a topic in a single session. The plan should be iterative.
-   **Deconstruction:** Break down complex topics into smaller, manageable learning sessions.
-   **Scaffolding:** Start with foundational concepts (those with fewer 'atomos_padre') and build upon them.

You must operate with the understanding that each session you define will be powered by a Spaced Repetition System (SRS) that optimizes the mix of questions and activities within that session to maximize learning efficiency. Your role is to define the high-level pedagogical sequence and focus for each session.

**User's Context:**
- **Objective:** "{{objective}}"
- **Project Title:** "{{projectTitle}}"
- **Time Limit:** "{{timeLimit}}"
- **Current Mastery Level:** "{{masteryLevel}}"
{{#if cognitiveProfile}}
- **Cognitive Profile:** The user prefers {{#each cognitiveProfile}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.
{{/if}}
{{#if learningChallenge}}
- **Main Learning Challenge:** The user's biggest challenge is {{learningChallenge}}.
{{/if}}

**Flashcards (Knowledge Atoms):**
{{#each flashcards}}
- **ID:** {{atomo_id}}
- **Concept:** {{concepto}}
- **Description:** {{descripcion}}
- **Prerequisites:** {{#if atomos_padre}}{{#each atomos_padre}}{{this}} {{/each}}{{else}}None{{/if}}
- **Difficulty:** {{dificultad_inicial}}
{{/each}}

**Your Task:**

1.  **Analyze the flashcards and determine a single, relevant category** for the project (e.g., "Programación", "Biología", "Historia").

2.  **Design a multi-session study plan.**
    -   Analyze the flashcards, their difficulties, and their dependencies ('atomos_padre') to create a logical sequence.
    -   If the user provided a cognitive profile or learning challenge, use that information to tailor the session types and justification. For example, if their challenge is "Entender conceptos muy teóricos o abstractos," strategically include a "Consulta con Koli" session for complex topics.
    -   The plan can have **multiple sessions per day** if needed to meet the user's time limit.
    -   The total number of sessions should be between 5 and 15, depending on the complexity and volume of the material.
    -   For each session, define a **'topic'** that is a brief summary of what the user is expected to learn in that session (e.g., "Identificar los componentes principales y sus funciones").
    -   Assign a 'sessionType' to each session from the following list. **You do not need to use all of them**. Use them strategically based on the pedagogical principles.
        -   **Calibración Inicial**: Use for the very first session to establish a knowledge baseline.
        -   **Incursión**: Use for introducing new sets of concepts for the first time.
        -   **Refuerzo de Dominio**: The most common type, for reinforcing concepts via spaced repetition.
        -   **Prueba de Dominio**: Use as a final "exam" session to verify overall mastery.
        -   **Consulta con Koli**: Use sparingly for particularly complex or abstract topics that would benefit from a deeper, conversational dive, especially if the user's profile indicates this need.

3.  **Write a brief, encouraging justification.**
    -   Explain the pedagogical reasoning behind your plan's structure, connecting it to the user's stated objective and time limit. If calibration data was provided, mention how it influenced the plan.

4.  **Provide an 'expectedProgress' explanation.**
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
