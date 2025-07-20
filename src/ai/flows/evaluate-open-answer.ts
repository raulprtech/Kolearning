'use server';

/**
 * @fileOverview Evaluates a user's open-ended answer against a correct answer.
 *
 * - evaluateOpenAnswer - A function that evaluates the user's answer.
 * - EvaluateOpenAnswerInput - The input type for the evaluateOpenAnswer function.
 * - EvaluateOpenAnswerOutput - The return type for the evaluateOpenAnswer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EvaluateOpenAnswerInputSchema = z.object({
  question: z.string().describe('The original question that was asked.'),
  correctAnswer: z.string().describe('The ground truth correct answer to the question.'),
  userAnswer: z.string().describe("The user's submitted answer."),
});
export type EvaluateOpenAnswerInput = z.infer<typeof EvaluateOpenAnswerInputSchema>;

const EvaluateOpenAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer is considered correct."),
  feedback: z
    .string()
    .describe(
      "Brief, one-sentence feedback explaining why the answer is incorrect. If the answer is correct, this should be a short, encouraging message like '¡Correcto!'."
    ),
  rephrasedQuestion: z
    .string()
    .optional()
    .describe(
      "A rephrased version of the original question to guide the user. This should only be provided if the user's answer is incorrect."
    ),
});
export type EvaluateOpenAnswerOutput = z.infer<typeof EvaluateOpenAnswerOutputSchema>;

export async function evaluateOpenAnswer(input: EvaluateOpenAnswerInput): Promise<EvaluateOpenAnswerOutput> {
  return evaluateOpenAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateOpenAnswerPrompt',
  input: { schema: EvaluateOpenAnswerInputSchema },
  output: { schema: EvaluateOpenAnswerOutputSchema },
  prompt: `You are an expert evaluator for a learning application. Your task is to assess a user's answer to a question.

Analyze the user's answer and determine if it is substantially correct when compared to the provided correct answer. Minor differences in wording are acceptable as long as the core concepts are accurate.

- If the user's answer is correct, set 'isCorrect' to true and provide brief, positive feedback.
- If the user's answer is incorrect, set 'isCorrect' to false. Provide a concise, one-sentence feedback explaining the main error. Then, rephrase the original question in a simpler way or from a different angle to give the user another chance. Do not give away the answer in your feedback or rephrased question.

Original Question:
"""
{{question}}
"""

Correct Answer:
"""
{{correctAnswer}}
"""

User's Answer:
"""
{{userAnswer}}
"""
`,
});

const evaluateOpenAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateOpenAnswerFlow',
    inputSchema: EvaluateOpenAnswerInputSchema,
    outputSchema: EvaluateOpenAnswerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
