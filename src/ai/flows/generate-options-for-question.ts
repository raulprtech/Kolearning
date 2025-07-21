'use server';

/**
 * @fileOverview Generates multiple-choice options for a given question and answer.
 *
 * - generateOptionsForQuestion - A function that creates plausible distractors for a question.
 */

import { ai } from '@/ai/genkit';
import { GenerateOptionsForQuestionInputSchema, GenerateOptionsForQuestionOutputSchema, type GenerateOptionsForQuestionInput, type GenerateOptionsForQuestionOutput } from '@/types';


export async function generateOptionsForQuestion(
  input: GenerateOptionsForQuestionInput
): Promise<GenerateOptionsForQuestionOutput> {
  return generateOptionsForQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOptionsForQuestionPrompt',
  input: { schema: GenerateOptionsForQuestionInputSchema },
  output: { schema: GenerateOptionsForQuestionOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert in creating educational content. Your task is to generate a set of multiple-choice options for a given question.

You will be provided with a question and its correct answer. Based on this, you must:
1.  Create three distinct, plausible, but incorrect answers (distractors). These distractors should be related to the topic of the question and common misconceptions.
2.  Combine the correct answer with the three distractors to form a list of four options.
3.  Return these four options in a randomized order.

**Question:**
"{{question}}"

**Correct Answer:**
"{{correctAnswer}}"

Your output MUST be a JSON object that follows this schema:
\`\`\`json
${JSON.stringify(GenerateOptionsForQuestionOutputSchema.shape, null, 2)}
\`\`\`
`,
});

const generateOptionsForQuestionFlow = ai.defineFlow(
  {
    name: 'generateOptionsForQuestionFlow',
    inputSchema: GenerateOptionsForQuestionInputSchema,
    outputSchema: GenerateOptionsForQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
