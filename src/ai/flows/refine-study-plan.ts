'use server';

/**
 * @fileOverview Refines a study plan based on a user's session performance.
 *
 * - refineStudyPlan - A function that analyzes a session summary and suggests plan modifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { StudyPlan } from '@/types';

const SessionPerformanceSummarySchema = z.object({
  totalCards: z.number(),
  correctCards: z.number(),
  incorrectCards: z.number(),
  difficultCards: z.array(z.object({
    question: z.string(),
    attempts: z.number(),
    timesAskedForHelp: z.number(),
  })),
});

const RefineStudyPlanInputSchema = z.object({
  currentPlan: z.array(z.object({
    topic: z.string(),
    sessionType: z.string(),
  })),
  completedSessionIndex: z.number(),
  performanceSummary: SessionPerformanceSummarySchema,
});

const RefineStudyPlanOutputSchema = z.object({
  needsChange: z.boolean().describe("Whether the study plan needs to be modified based on the user's performance."),
  updatedPlan: z.array(z.object({
    topic: z.string(),
    sessionType: z.string(),
  })).describe("The full, updated study plan. Only modify if needsChange is true."),
  reasoning: z.string().optional().describe("A brief explanation of the changes made, to be shown to the user."),
});

export async function refineStudyPlan(input: z.infer<typeof RefineStudyPlanInputSchema>): Promise<z.infer<typeof RefineStudyPlanOutputSchema>> {
  return refineStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineStudyPlanPrompt',
  input: { schema: RefineStudyPlanInputSchema },
  output: { schema: RefineStudyPlanOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert instructional designer named Koli. Your task is to analyze a user's performance in a study session and decide if their upcoming study plan needs adjustments.

**Current Study Plan:**
{{#each currentPlan}}
- Session {{add @index 1}}: {{topic}} ({{sessionType}})
{{/each}}

**Session Just Completed:** Session {{add completedSessionIndex 1}}

**Performance Summary:**
- Total Cards: {{performanceSummary.totalCards}}
- Correct: {{performanceSummary.correctCards}}
- Incorrect: {{performanceSummary.incorrectCards}}
- Cards marked as difficult:
  {{#each performanceSummary.difficultCards}}
  - Question: "{{question}}" (Attempts: {{attempts}}, Help Requests: {{timesAskedForHelp}})
  {{else}}
  - None
  {{/each}}

**Your Task:**

1.  **Analyze the performance.**
    - If the user answered most questions correctly and had few difficulties, the plan is likely effective. Set 'needsChange' to false.
    - If the user struggled significantly (e.g., high number of incorrect answers, many difficult cards, multiple attempts/help requests), the plan needs adjustment. Set 'needsChange' to true.

2.  **If 'needsChange' is true, modify the plan.**
    - Focus on the **next** session (index {{add completedSessionIndex 1}}).
    - If the user struggled with foundational concepts, consider changing the next session to a "Brecha Detectada" or "Refuerzo de Dominio" type, focusing on the difficult topics.
    - You might merge a difficult topic into the next session or create a new, dedicated review session.
    - **Do not change past sessions.** Return the entire plan, including the unchanged past sessions and the modified future sessions.
    - Provide a brief 'reasoning' for the change, e.g., "Noté que algunos conceptos fueron desafiantes, así que he ajustado la próxima sesión para reforzarlos."

3.  **If 'needsChange' is false, return the original plan unmodified.**

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(RefineStudyPlanOutputSchema.shape, null, 2)}
\`\`\`
`,
});

const refineStudyPlanFlow = ai.defineFlow(
  {
    name: 'refineStudyPlanFlow',
    inputSchema: RefineStudyPlanInputSchema,
    outputSchema: RefineStudyPlanOutputSchema,
  },
  async (input) => {
    // Custom helper for handlebars
    (prompt as any).handlebars.registerHelper('add', (a: number, b: number) => a + b);
    
    const { output } = await prompt(input);
    return output!;
  }
);
