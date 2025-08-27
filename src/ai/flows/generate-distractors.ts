// src/ai/flows/generate-distractors.ts
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDistractorsInputSchema = z.object({
  question: z.string().describe('The question for which to generate distractors.'),
  answer: z.string().describe('The correct answer to the question.'),
  count: z.number().describe('The number of distractors to generate.'),
});

export type GenerateDistractorsInput = z.infer<typeof GenerateDistractorsInputSchema>;

const GenerateDistractorsOutputSchema = z.object({
  distractors: z.array(z.string()).describe('An array of incorrect but plausible answers.'),
});

export type GenerateDistractorsOutput = z.infer<typeof GenerateDistractorsOutputSchema>;

export async function generateDistractors(input: GenerateDistractorsInput): Promise<GenerateDistractorsOutput> {
  return generateDistractorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDistractorsPrompt',
  input: {schema: GenerateDistractorsInputSchema},
  output: {schema: GenerateDistractorsOutputSchema},
  prompt: `You are an expert in creating educational content. Given a question and its correct answer, your task is to generate a specified number of incorrect but plausible answer options (distractors) for a multiple-choice question. These distractors should be common misconceptions or related concepts that might confuse a learner.
Your response must be in Spanish.

Question: {{{question}}}
Correct Answer: {{{answer}}}
Number of Distractors to Generate: {{{count}}}

Generate the distractors and provide them in the specified JSON format.`,
});

const generateDistractorsFlow = ai.defineFlow(
  {
    name: 'generateDistractorsFlow',
    inputSchema: GenerateDistractorsInputSchema,
    outputSchema: GenerateDistractorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);