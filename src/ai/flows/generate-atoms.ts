
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
  userObjective: z.string().describe('The user\'s stated objective for learning the material.')
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
  prompt: `You are Koli, an AI-powered tutor, orchestrating a pipeline of expert agents to create a knowledge graph for a learner.
All your responses must be in Spanish.

The user has uploaded study material and stated their learning objective.

Your mission is to execute the following agent pipeline to deconstruct, understand, and restructure the content for a pedagogical purpose.

**Pipeline de Atomización:**

1.  **Agente Extractor (El Explorador):**
    *   **Misión:** Your first task is to act as the Extractor Agent. Read the raw study material and extract all fundamental entities: concepts, definitions, formulas, dates, and any other key pieces of information. These will become the "nodes" of our knowledge graph.
    *   **Resultado (Interno):** A structured list of all potential units of knowledge.

2.  **Agente Relacionador (El Cartógrafo):**
    *   **Misión:** Next, as the Relator Agent, take the list of entities from the Extractor and analyze the original text to map the connections and relationships between them ("is a type of," "causes," "depends on," etc.). Your job is to draw the "edges" that connect the nodes of our graph.
    *   **Resultado (Interno):** A relationship map that gives structure and context to the extracted knowledge.

3.  **Agente Validador (El Inspector de Calidad y Armero):**
    *   **Misión:** Finally, as the Validator Agent, perform a final review of the consistency of the knowledge graph created by the previous two agents. Once validated, generate the final "flashcards" or "Knowledge Atoms" in a question/answer format.
    *   **Resultado (Público):** The final set of high-quality, validated "Knowledge Atoms," ready to be integrated into the Learner's Study Plan.

**Your Tasks:**

1.  **Generate 'initialResponse':** Craft a brief, friendly, and conversational "initialResponse". This response should acknowledge their uploaded material and their objective.
2.  **Execute the Pipeline:** In the background, execute the 3-agent pipeline described above to process the study material.
3.  **Generate 'atoms':** The output of your pipeline should be the final, validated array of question-and-answer pairs.

**User Input:**
User's Learning Objective: {{{userObjective}}}
Study Material: {{media url=studyMaterial}}

IMPORTANT: If the provided study material has an unsupported MIME type (like 'application/octet-stream'), you must treat it as a 'text/plain' file and process its content accordingly.

Generate the "initialResponse" and the "atoms" array. Return the result in the specified JSON format.
  `,
});

const SUPPORTED_MIME_TYPES_REGEX = /^(image\/(jpeg|png|webp))|(audio\/(mpeg|mp3|wav|ogg))|(video\/(mp4|mpeg|quicktime))|(text\/(plain|html|css|csv|markdown|xml))|application\/(pdf|json|rtf|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|msword|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/;

const generateAtomsFlow = ai.defineFlow(
  {
    name: 'generateAtomsFlow',
    inputSchema: GenerateAtomsInputSchema,
    outputSchema: GenerateAtomsOutputSchema,
  },
  async input => {
    let studyMaterial = input.studyMaterial;
    const mimeTypeMatch = studyMaterial.match(/^data:([a-zA-Z0-9\/+.-]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : '';

    if (!SUPPORTED_MIME_TYPES_REGEX.test(mimeType)) {
      console.log(`Unsupported MIME type "${mimeType}". Converting to "text/plain".`);
      studyMaterial = studyMaterial.replace(/^data:[a-zA-Z0-9\/+.-]+/, 'data:text/plain');
    }

    const {output} = await orchestratorPrompt({
        ...input,
        studyMaterial: studyMaterial,
    });
    return output!;
  }
);
