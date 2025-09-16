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
import { generateDistractors } from './generate-distractors';

const GenerateAtomsInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe(
      'The study material to be atomized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type GenerateAtomsInput = z.infer<typeof GenerateAtomsInputSchema>;

const GenerateAtomsOutputSchema = z.object({
  initialResponse: z.string().describe('A conversational, welcoming response to the user.'),
  atoms: z.array(z.object({
    question: z.string().describe('The question generated from the study material.'),
    answer: z.string().describe('The answer to the question.'),
    incorrectAnswers: z.array(z.string()).optional().describe('An array of plausible incorrect answers (distractors).')
  })).describe('An array of question/answer pairs generated from the study material.'),
});
export type GenerateAtomsOutput = z.infer<typeof GenerateAtomsOutputSchema>;

export async function generateAtoms(input: GenerateAtomsInput): Promise<GenerateAtomsOutput> {
  return generateAtomsFlow(input);
}


// Helper function for retries with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries > 0 && e.message.includes('503 Service Unavailable')) {
      console.warn(`Service unavailable, retrying in ${delay / 1000}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw e;
  }
}

const generateAtomsFlow = ai.defineFlow(
  {
    name: 'generateAtomsFlow',
    inputSchema: GenerateAtomsInputSchema,
    outputSchema: GenerateAtomsOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      prompt: `You are Koli, an AI-powered tutor specializing in knowledge extraction and atomization.
All your responses must be in Spanish.

The user has uploaded study material: ${input.studyMaterial}

Your mission: Extract EVERY concept, definition, key date, formula, or relevant information and convert it into question/answer pairs.

CRITICAL RULES:
1. CONTENT FILTERING: Ignore bibliographies, references, tables of contents, indices, acknowledgements, and title pages.
2. BE EXHAUSTIVE: Generate as many atoms as necessary to cover the entire material.
3. QUALITY ATOMS: Each atom must be clear, concise, and pedagogically sound.
4. NO EMPTY ANSWERS: If you can't find a clear answer, discard that atom.

RESPOND WITH VALID JSON ONLY:
{
  "initialResponse": "¡Hola! He recibido tu material de estudio y comenzaré con el análisis...",
  "atoms": [
    {
      "question": "¿Qué es...?",
      "answer": "Es..."
    }
  ]
}`,
      model: 'googleai/gemini-2.5-flash-lite',
      output: { 
        schema: GenerateAtomsOutputSchema,
        format: 'json'
      },
      config: { 
        temperature: 0.1,
        maxOutputTokens: 8192
      },
    });

    if (!response?.output) {
      throw new Error('Failed to generate initial atoms.');
    }

    const output = response.output;

    // Validate that atoms array exists
    if (!output.atoms || !Array.isArray(output.atoms)) {
      console.error('Invalid response from AI model:', output);
      throw new Error('AI model response missing required atoms array');
    }

    // Generate distractors for each atom in parallel with retry logic
    const atomsWithDistractors = await Promise.all(
      output.atoms.map(async (atom) => {
        try {
          const distractorsResponse = await withRetry(() => 
            generateDistractors({
              question: atom.question,
              answer: atom.answer,
              count: 3,
            })
          );
          return {
            ...atom,
            incorrectAnswers: distractorsResponse.distractors,
          };
        } catch (e) {
          console.error(`Failed to generate distractors for: "${atom.question}" after multiple retries.`, e);
          // Return the atom without distractors if generation fails
          return atom;
        }
      })
    );

    return {
      ...output,
      atoms: atomsWithDistractors,
    };
  }
);
