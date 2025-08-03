'use server';
/**
 * @fileOverview Provides an explanation of the correct answer to a question.
 *
 * - explainCorrectAnswer - A function that explains the correct answer to a question.
 * - ExplainCorrectAnswerInput - The input type for the explainCorrectAnswer function.
 * - ExplainCorrectAnswerOutput - The return type for the explainCorrectAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainCorrectAnswerInputSchema = z.object({
  question: z.string().describe('The question that was asked.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  learnerAnswer: z.string().describe('The learner\'s answer to the question.'),
  context: z.string().describe('Additional context or information related to the question.'),
});
export type ExplainCorrectAnswerInput = z.infer<typeof ExplainCorrectAnswerInputSchema>;

const ExplainCorrectAnswerOutputSchema = z.object({
  explanation: z.string().describe('The explanation of why the provided answer is correct.'),
});
export type ExplainCorrectAnswerOutput = z.infer<typeof ExplainCorrectAnswerOutputSchema>;

export async function explainCorrectAnswer(input: ExplainCorrectAnswerInput): Promise<ExplainCorrectAnswerOutput> {
  return explainCorrectAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainCorrectAnswerPrompt',
  input: {schema: ExplainCorrectAnswerInputSchema},
  output: {schema: ExplainCorrectAnswerOutputSchema},
  prompt: `You are Koli, an expert AI tutor. A learner has asked for an explanation of the correct answer to a question. Your job is to provide a clear and concise explanation of why the correct answer is correct, and where the learner's answer went wrong.

Question: {{{question}}}
Correct Answer: {{{correctAnswer}}}
Learner's Answer: {{{learnerAnswer}}}
Context: {{{context}}}

Explanation:`,
});

const explainCorrectAnswerFlow = ai.defineFlow(
  {
    name: 'explainCorrectAnswerFlow',
    inputSchema: ExplainCorrectAnswerInputSchema,
    outputSchema: ExplainCorrectAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
