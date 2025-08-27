
'use server';

/**
 * @fileOverview Generates question/answer pairs from uploaded study materials.
 *
 * - generateAtoms - A function that handles the generation of atoms from uploaded content.
 * - GenerateAtomsInput - The input type for the generateAtoms function.
 * - GenerateAtomsOutput - The return type for the generateAtoms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAtomsInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe(
      'The study material to be atomized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
  userObjective: z.string().describe('The user\'s stated objective for learning the material.').optional()
});
export type GenerateAtomsInput = z.infer<typeof GenerateAtomsInputSchema>;

const GenerateAtomsOutputSchema = z.object({
  initialResponse: z.string().describe('A conversational, welcoming response to the user.'),
  atoms: z.array(z.object({
    question: z.string().describe('The question generated from the study material.'),
    answer: z.string().describe('The answer to the question.'),
  })).describe('An array of question/answer pairs generated from the study material.'),
});
export type GenerateAtomsOutput = z.infer<typeof GenerateAtomsOutputSchema>;

export async function generateAtoms(input: GenerateAtomsInput): Promise<GenerateAtomsOutput> {
  return generateAtomsFlow(input);
}

const orchestratorPrompt = ai.definePrompt({
  name: 'atomizationOrchestratorPrompt',
  input: {schema: GenerateAtomsInputSchema},
  output: {schema: GenerateAtomsOutputSchema},
  prompt: `You are Koli, an AI-powered tutor specializing in knowledge extraction and atomization.
All your responses must be in Spanish.

The user has uploaded study material.

**Your Mission:**

Your one and only mission is to read the study material provided and extract EVERY concept, definition, key date, formula, or any other relevant piece of information, and convert it into a "Knowledge Atom" (a question/answer pair).

**CRITICAL RULES:**
1.  **CONTENT FILTERING:** Before atomization, you MUST identify and completely ignore sections that are not core learning material. This includes, but is not limited to: bibliographies, lists of references, tables of contents, indices, acknowledgements, and title pages. Your focus should be exclusively on the main body of text that contains the knowledge to be learned.
2.  **BE EXHAUSTIVE:** Do not summarize the content. Your goal is to be thorough and generate as many atoms as necessary to cover the entire material. Do not omit details or important concepts, even if they seem minor. The user needs a comprehensive set of atoms to master the topic.
3.  **QUALITY ATOMS:** Each atom must be clear, concise, and pedagogically sound. The question should be a real question, and the answer should be the direct and correct response.
4.  **NO EMPTY ANSWERS:** If you identify a potential question but cannot find or infer a clear answer from the text, you MUST discard that atom. Do not create atoms with empty or missing answers under any circumstances.

**Your Tasks:**

1.  **Generate 'initialResponse':** Craft a brief, friendly, and conversational "initialResponse". This response should acknowledge their uploaded material, confirming that you are beginning the analysis.
2.  **Generate 'atoms':** Perform your mission. Read the user's material and generate a comprehensive array of question-and-answer pairs. There is no limit.

**User Input:**
Study Material: {{media url=studyMaterial}}

IMPORTANT: If the provided study material has an unsupported MIME type (like 'application/octet-stream'), you must treat it as a 'text/plain' file and process its content accordingly.

Generate the "initialResponse" and the "atoms" array. Return the result in the specified JSON format.
  `,
  config: {
    temperature: 0,
  },
});

const generateAtomsFlow = ai.defineFlow(
  {
    name: 'generateAtomsFlow',
    inputSchema: GenerateAtomsInputSchema,
    outputSchema: GenerateAtomsOutputSchema,
  },
  async input => {
    const {output} = await orchestratorPrompt(input);
    return output!;
  }
);

    