'use server';

/**
 * @fileOverview Refines project details using AI.
 *
 * - refineProjectDetails - Suggests a better title, description, and category.
 */

import { ai } from '@/ai/genkit';
import { RefineProjectDetailsInputSchema, RefineProjectDetailsOutputSchema, type RefineProjectDetailsInput, type RefineProjectDetailsOutput } from '@/types';


export async function refineProjectDetails(input: RefineProjectDetailsInput): Promise<RefineProjectDetailsOutput> {
  return refineProjectDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineProjectDetailsPrompt',
  input: { schema: RefineProjectDetailsInputSchema },
  output: { schema: RefineProjectDetailsOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert at creating educational content. Your task is to analyze a list of flashcards and refine the project's metadata.

Based on the flashcards provided, generate a new, improved title, description, and a single category for the project.

- The title should be clear and engaging.
- The description should be a concise summary.
- The category should be a single, relevant term.
- All output must be in Spanish.

Even if the user provided a title or description, create a new one based on the content of the flashcards.

Flashcards:
{{#each flashcards}}
- Q: {{question}}
- A: {{answer}}
{{/each}}

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(RefineProjectDetailsOutputSchema.shape, null, 2)}
\`\`\`
`,
});

const refineProjectDetailsFlow = ai.defineFlow(
  {
    name: 'refineProjectDetailsFlow',
    inputSchema: RefineProjectDetailsInputSchema,
    outputSchema: RefineProjectDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
