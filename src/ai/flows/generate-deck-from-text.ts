
'use server';

/**
 * @fileOverview Generates a flashcard deck from a blob of text, a PDF, HTML, or one or more images.
 *
 * - generateDeckFromText - A function that generates a flashcard deck.
 */

import { ai } from '@/ai/genkit';
import { GenerateDeckFromTextInputSchema, GenerateDeckFromTextOutputSchema, type GenerateDeckFromTextInput, type GenerateDeckFromTextOutput } from '@/types';


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
The notes may be plain text, Markdown, LaTeX, HTML, a full document (like a PDF as a Data URI), or a collection of images (as Data URIs).

IMPORTANT: The final output (title, description, and flashcards) must be entirely in Spanish.

If the input is HTML, focus on the main content and ignore navigational elements, ads, and footers.
If the input is one or more images, analyze the content of all images together to create a single, coherent deck.

Based on the content, generate a suitable title and a one-sentence description for the deck.

Then, create a minimum of 5 and a maximum of 15 flashcards, focusing on the most important concepts, definitions, and key facts in the text. Preserve and use Markdown and LaTeX formatting in the questions and answers to ensure clarity and accuracy (e.g., for code, lists, or mathematical expressions).

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(GenerateDeckFromTextOutputSchema.shape, null, 2)}
\`\`\`

Study Notes:
{{#if studyNotesIsArray}}
  {{#each studyNotes}}
    {{media url=this}}
  {{/each}}
{{else}}
  {{#if studyNotesIsDataUri}}
    {{media url=studyNotes}}
  {{else}}
    {{{studyNotes}}}
  {{/if}}
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
    const isArray = Array.isArray(studyNotes);
    const isDataUri = typeof studyNotes === 'string' && studyNotes.startsWith('data:');

    // The prompt expects an object that includes our logic flags.
    const promptInput = {
      studyNotes: studyNotes,
      studyNotesIsArray: isArray,
      studyNotesIsDataUri: isDataUri,
    };

    const { output } = await prompt(promptInput);
    return output!;
  }
);
