
'use server';

/**
 * @fileOverview Refines project details using AI.
 *
 * - refineProjectDetails - Suggests a better title, description, and category.
 * - RefineProjectDetailsInput - The input type for the function.
 * - RefineProjectDetailsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FlashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const RefineProjectDetailsInputSchema = z.object({
  currentTitle: z.string().optional().describe('The user\'s current title for the project.'),
  currentDescription: z.string().optional().describe('The user\'s current description.'),
  flashcards: z.array(FlashcardSchema).describe('The list of flashcards to analyze.'),
});
export type RefineProjectDetailsInput = z.infer<typeof RefineProjectDetailsInputSchema>;

export const RefineProjectDetailsOutputSchema = z.object({
  title: z.string().describe('A concise, descriptive, and engaging title for the project in Spanish.'),
  description: z.string().describe('A one or two-sentence summary of the project in Spanish.'),
  category: z.string().describe('A relevant, single-word category for the project in Spanish (e.g., "Programación", "Biología", "Historia").'),
});
export type RefineProjectDetailsOutput = z.infer<typeof RefineProjectDetailsOutputSchema>;

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
