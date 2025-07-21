
'use server';

/**
 * @fileOverview Generates a flashcard deck from a blob of text or a PDF.
 *
 * - generateDeckFromText - A function that generates a flashcard deck.
 * - GenerateDeckFromTextInput - The input type for the generateDeckFromText function.
 * - GenerateDeckFromTextOutput - The return type for the generateDeckFromText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDeckFromTextInputSchema = z.object({
  studyNotes: z
    .string()
    .describe(
      'The study notes to generate a flashcard deck from. Can be plain text, Markdown, LaTeX, a Data URI for a PDF, or HTML content.'
    ),
});
export type GenerateDeckFromTextInput = z.infer<typeof GenerateDeckFromTextInputSchema>;

const GenerateDeckFromTextOutputSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated flashcard deck.'),
  description: z.string().describe('A brief, one-sentence description of the flashcard deck.'),
  flashcards: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            'The flashcard question (supports Markdown and LaTeX). Should be a clear, answerable question based on the notes.'
          ),
        answer: z
          .string()
          .describe(
            'The flashcard answer (supports Markdown and LaTeX). Should be a concise and accurate answer to the question.'
          ),
      })
    )
    .min(5)
    .max(15)
    .describe('An array of 5 to 15 flashcards based on the key concepts in the notes.'),
});
export type GenerateDeckFromTextOutput = z.infer<typeof GenerateDeckFromTextOutputSchema>;

export async function generateDeckFromText(input: GenerateDeckFromTextInput): Promise<GenerateDeckFromTextOutput> {
  return generateDeckFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeckFromTextPrompt',
  input: { schema: GenerateDeckFromTextInputSchema },
  output: { schema: GenerateDeckFromTextOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert at creating study materials. Your task is to analyze the following study notes and convert them into a structured flashcard deck.
The notes may be plain text, Markdown, LaTeX, HTML, or a full document (like a PDF or image) provided as a Data URI.

If the input is HTML, focus on the main content and ignore navigational elements, ads, and footers.

Based on the content, generate a suitable title and a one-sentence description for the deck.

Then, create a minimum of 5 and a maximum of 15 flashcards, focusing on the most important concepts, definitions, and key facts in the text. Preserve and use Markdown and LaTeX formatting in the questions and answers to ensure clarity and accuracy (e.g., for code, lists, or mathematical expressions).

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(GenerateDeckFromTextOutputSchema.shape, null, 2)}
\`\`\`

Study Notes:
{{#if studyNotesIsText}}
{{{studyNotes}}}
{{else}}
{{media url=studyNotes}}
{{/if}}
`,
});

const generateDeckFromTextFlow = ai.defineFlow(
  {
    name: 'generateDeckFromTextFlow',
    inputSchema: GenerateDeckFromTextInputSchema,
    outputSchema: GenerateDeckFromTextOutputSchema,
  },
  async ({ studyNotes }) => {
    const isDataUri = studyNotes.startsWith('data:');
    
    // The prompt expects an object that includes our logic flag `studyNotesIsText`.
    const promptInput = {
      studyNotes: studyNotes,
      studyNotesIsText: !isDataUri,
    };

    const { output } = await prompt(promptInput);
    return output!;
  }
);
