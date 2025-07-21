// src/ai/flows/generate-deck-from-topic.ts
'use server';

/**
 * @fileOverview Generates a flashcard deck from a given topic.
 *
 * - generateDeckFromTopic - A function that generates a flashcard deck from a topic.
 * - GenerateDeckFromTopicInput - The input type for the generateDeckFromTopic function.
 * - GenerateDeckFromTopicOutput - The return type for the generateDeckFromTopic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDeckFromTopicInputSchema = z.object({
  topic: z.string().describe('The topic to generate a flashcard deck for.'),
  numFlashcards: z.number().default(5).describe('The number of flashcards to generate.'),
});
export type GenerateDeckFromTopicInput = z.infer<typeof GenerateDeckFromTopicInputSchema>;

const GenerateDeckFromTopicOutputSchema = z.object({
  title: z.string().describe('The title of the generated flashcard deck.'),
  description: z.string().describe('A brief description of the flashcard deck.'),
  flashcards: z.array(
    z.object({
      question: z.string().describe('The flashcard question (supports Markdown).'),
      answer: z.string().describe('The flashcard answer (supports Markdown).'),
    })
  ).describe('The generated flashcards.'),
});
export type GenerateDeckFromTopicOutput = z.infer<typeof GenerateDeckFromTopicOutputSchema>;

export async function generateDeckFromTopic(input: GenerateDeckFromTopicInput): Promise<GenerateDeckFromTopicOutput> {
  return generateDeckFromTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeckFromTopicPrompt',
  input: {schema: GenerateDeckFromTopicInputSchema},
  output: {schema: GenerateDeckFromTopicOutputSchema},
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are a helpful teacher. Please generate a flashcard deck on the topic of "{{topic}}".

The deck should have {{numFlashcards}} flashcards.

The flashcards should be clear and concise. Format questions and answers using Markdown where appropriate.

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(GenerateDeckFromTopicOutputSchema.shape, null, 2)}
\`\`\`
`,
});

const generateDeckFromTopicFlow = ai.defineFlow(
  {
    name: 'generateDeckFromTopicFlow',
    inputSchema: GenerateDeckFromTopicInputSchema,
    outputSchema: GenerateDeckFromTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
