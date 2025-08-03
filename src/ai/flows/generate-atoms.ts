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
  prompt: `You are Koli, an AI-powered tutor. Your goal is to help the user create a personalized learning project.

The user has just uploaded study material and provided their learning objective.

Your tasks are:
1.  Craft a brief, friendly, and conversational "initialResponse". This response should acknowledge their uploaded material and their objective. If they haven't stated a clear objective, you can ask a clarifying question. Avoid being repetitive. For example, if they've already told you their goal is an exam, don't ask what their goal is.
2.  In the background, while you respond, process the provided study material to "atomize" it. This means breaking it down into fundamental question-and-answer pairs, which we call "atoms".
3.  The atomization process uses an Agent Pipeline: Extractor -> Relator -> Generator -> Validator. Your output should be the final, validated array of atoms.

User's Learning Objective: {{{userObjective}}}
Study Material: {{media url=studyMaterial}}

Generate the "initialResponse" and the "atoms" array. Return the result in JSON format.
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
