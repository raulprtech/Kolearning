'use server';

/**
 * @fileOverview Evaluates a user's open-ended answer against a correct answer.
 *
 * - evaluateOpenAnswer - A function that evaluates the user's answer.
 */

import { ai } from '@/ai/genkit';
import { EvaluateOpenAnswerInputSchema, EvaluateOpenAnswerOutputSchema, type EvaluateOpenAnswerInput, type EvaluateOpenAnswerOutput } from '@/types';

export async function evaluateOpenAnswer(input: EvaluateOpenAnswerInput): Promise<EvaluateOpenAnswerOutput> {
  return evaluateOpenAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateOpenAnswerPrompt',
  input: { schema: EvaluateOpenAnswerInputSchema },
  output: { schema: EvaluateOpenAnswerOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert evaluator for a learning application. Your task is to assess a user's answer to a question and provide constructive, personalized feedback.

Analyze the user's answer and determine if it is substantially correct when compared to the provided correct answer. Minor differences in wording are acceptable as long as the core concepts are accurate.

- If the user's answer is correct, set 'isCorrect' to true and provide brief, positive feedback (e.g., '¡Correcto!', '¡Excelente!').
- If the user's answer is incorrect, set 'isCorrect' to false and do the following:
  1.  **Analyze the user's answer for partial correctness.**
  2.  **Generate personalized feedback.**
      - If the user is on the right track but missed a key point, acknowledge their effort (e.g., "¡Estás cerca!", "Vas por buen camino, pero recuerda que..."). Then, briefly state what's missing or needs correction.
      - If the answer is completely off-track, provide a concise, one-sentence feedback explaining the main error.
  3.  **Rephrase the original question.** Create a simpler version or reframe it from a different angle to give the user another chance.

**Crucially, do not give away the full answer in your feedback or rephrased question.** Your goal is to guide, not to provide solutions.

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
