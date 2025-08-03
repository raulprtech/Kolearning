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
});
export type GenerateAtomsInput = z.infer<typeof GenerateAtomsInputSchema>;

const GenerateAtomsOutputSchema = z.object({
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
  prompt: `You are an AI System Architect, Product Designer, and Full-Stack Engineer, tasked with atomizing study material into question/answer pairs.

  The user will upload study material, and your task is to process it through an Agent Pipeline to create question/answer pairs.
  The Agent Pipeline consists of the following agents:
  1. Agent Extractor: Identifies key entities and concepts (nodes).
  2. Agent Relator: Maps the connections between entities (edges).
  3. Agent Generator of Atoms: Converts each entity into question/answer formats.
  4. Agent Validator: Ensures the quality and consistency of the graph and atoms.

  Here is the study material:
  {{media url=studyMaterial}}

  Generate an array of question/answer pairs based on the study material. Return the result in JSON format.
  `,
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
