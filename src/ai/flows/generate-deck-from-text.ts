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
  prompt: `You are an expert at creating study materials and structuring knowledge. Your task is to analyze the following study notes and convert them into a structured flashcard deck composed of "knowledge atoms".
The notes may be plain text, Markdown, LaTeX, HTML, a full document (like a PDF as a Data URI), or a collection of images (as Data URIs).

IMPORTANT: The final output (title, description, and all flashcard fields) must be entirely in Spanish.

If the input is HTML, focus on the main content and ignore navigational elements, ads, and footers.
If the input is one or more images, analyze the content of all images together to create a single, coherent deck.

Based on the content, generate:
1.  A suitable title and a one-sentence description for the deck.
2.  A unique 'material_id' for this entire deck (e.g., 'MAT001').

Then, analyze the **entirety** of the provided resource. Your main priority is to extract **all relevant knowledge** and convert it into knowledge atoms (flashcards). Do not limit the number of cards; create as many as necessary to comprehensively cover the material.

For each knowledge atom, you must generate the following detailed structure:
-   **atomo_id**: A unique ID for the atom within this material, combining a prefix for the subject (e.g., ALG for algebra) and a number (e.g., "ALG023").
-   **material_id**: The ID for the entire deck you generated.
-   **concepto**: The core concept, term, or question. This will be the "front" of the flashcard.
-   **descripcion**: The definition, explanation, or answer. This will be the "back" of the flashcard. Preserve Markdown and LaTeX for clarity.
-   **atomos_padre**: An array of 'atomo_id's that are prerequisites for understanding this atom. This creates a dependency graph. If it's a foundational concept, the array can be empty.
-   **formatos_presentacion**: An array of suitable learning formats. Choose from: "Identificación", "Ejemplificación", "Comparación", "Causa y Efecto", "Procedimiento".
-   **dificultad_inicial**: The initial difficulty level. Choose from: "Fundamental", "Intermedio", "Avanzado", "Específico".

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
