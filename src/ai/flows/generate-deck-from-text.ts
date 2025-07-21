'use server';

/**
 * @fileOverview Generates a flashcard deck from a blob of text.
 *
 * - generateDeckFromText - A function that generates a flashcard deck from text.
 * - GenerateDeckFromTextInput - The input type for the generateDeckFromText function.
 * - GenerateDeckFromTextOutput - The return type for the generateDeckFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDeckFromTextInputSchema = z.object({
  studyNotes: z.string().describe('The study notes to generate a flashcard deck from. Can include Markdown and LaTeX.'),
});
export type GenerateDeckFromTextInput = z.infer<typeof GenerateDeckFromTextInputSchema>;

const GenerateDeckFromTextOutputSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated flashcard deck.'),
  description: z.string().describe('A brief, one-sentence description of the flashcard deck.'),
  flashcards: z.array(
    z.object({
      question: z.string().describe('The flashcard question (supports Markdown and LaTeX). Should be a clear, answerable question based on the notes.'),
      answer: z.string().describe('The flashcard answer (supports Markdown and LaTeX). Should be a concise and accurate answer to the question.'),
    })
  ).describe('An array of 5 to 15 flashcards based on the key concepts in the notes.'),
});
export type GenerateDeckFromTextOutput = z.infer<typeof GenerateDeckFromTextOutputSchema>;

export async function generateDeckFromText(input: GenerateDeckFromTextInput): Promise<GenerateDeckFromTextOutput> {
  return generateDeckFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeckFromTextPrompt',
  input: {schema: GenerateDeckFromTextInputSchema},
  output: {schema: GenerateDeckFromTextOutputSchema},
  prompt: `You are an expert at creating study materials. Your task is to analyze the following study notes and convert them into a structured flashcard deck. The notes may include Markdown for formatting and LaTeX for mathematical formulas.

Based on the content, generate a suitable title and a one-sentence description for the deck.

Then, create between 5 and 15 flashcards, focusing on the most important concepts, definitions, and key facts in the text. Each flashcard must have a clear question and a concise answer. Preserve and use Markdown and LaTeX formatting in the questions and answers to ensure clarity and accuracy (e.g., for code, lists, or mathematical expressions).

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(GenerateDeckFromTextOutputSchema.shape, null, 2)}
\`\`\`

Study Notes:
"""
{{studyNotes}}
"""
`,
});

const generateDeckFromTextFlow = ai.defineFlow(
  {
    name: 'generateDeckFromTextFlow',
    inputSchema: GenerateDeckFromTextInputSchema,
    outputSchema: GenerateDeckFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
