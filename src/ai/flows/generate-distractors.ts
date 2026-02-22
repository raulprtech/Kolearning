// src/ai/flows/generate-distractors.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

// Fallback function for generating basic distractors when AI generation fails
function generateFallbackDistractors(answer: string, count: number): string[] {
  const distractors: string[] = [];
  const isShortAnswer = answer.length <= 20;

  if (isShortAnswer) {
    // For short answers, create simple variations
    for (let i = 0; i < count; i++) {
      if (answer.toLowerCase().includes('sí') || answer.toLowerCase().includes('si')) {
        distractors.push('No');
      } else if (answer.toLowerCase().includes('no')) {
        distractors.push('Sí');
      } else if (/^\d+$/.test(answer)) {
        // If it's a number, create nearby numbers
        const num = parseInt(answer);
        distractors.push((num + 1).toString());
        if (distractors.length < count) distractors.push((num - 1).toString());
        if (distractors.length < count) distractors.push((num * 2).toString());
      } else {
        // Generic options for other short answers
        distractors.push(`Alternativa ${i + 1}`);
      }
    }
  } else {
    // For longer answers, create generic alternatives
    for (let i = 0; i < count; i++) {
      distractors.push(`Opción ${String.fromCharCode(65 + i)}: Alternativa incorrecta`);
    }
  }

  return distractors.slice(0, count);
}

export async function generateDistractors(input: GenerateDistractorsInput): Promise<GenerateDistractorsOutput> {
  try {
    return await generateDistractorsFlow(input);
  } catch (error) {
    console.warn('AI distractor generation failed, using fallback:', error);
    // Return fallback distractors when AI generation fails
    return {
      distractors: generateFallbackDistractors(input.answer, input.count)
    };
  }
}

const prompt = ai.definePrompt({
  name: 'generateDistractorsPrompt',
  input: { schema: GenerateDistractorsInputSchema },
  output: { schema: GenerateDistractorsOutputSchema },
  model: 'googleai/gemini-2.5-flash-lite',
  config: {
    temperature: 0.1,
    maxOutputTokens: 8192
  },
  prompt: `You are an expert in creating educational content. Given a question and its correct answer, your task is to generate a specified number of incorrect but plausible answer options (distractors) for a multiple-choice question. These distractors should be common misconceptions or related concepts that might confuse a learner.

Your response must be in Spanish.

IMPORTANT GUIDELINES:
1. For short answers (single words, numbers, dates, etc.), create distractors that are:
   - Similar in format or structure to the correct answer
   - Common alternatives or misconceptions
   - Plausible but clearly wrong options
2. For longer answers, focus on:
   - Related concepts that might be confused with the correct answer
   - Partial truths or incomplete explanations
   - Common errors in understanding
3. Ensure all distractors are realistic options a student might genuinely consider
4. Make distractors challenging but fair - they should test understanding, not trick students

Question: {{{question}}}
Correct Answer: {{{answer}}}
Number of Distractors to Generate: {{{count}}}

Examples of good distractors for different answer types:
- For dates: nearby years, significant dates in the same period
- For names: similar names, other relevant figures from the same field
- For numbers/quantities: reasonable alternative values, common calculation errors
- For definitions: related but distinct concepts, partial definitions
- For short phrases: variations with key words changed or concepts mixed up

Generate the distractors and provide them in the specified JSON format.`,
});

const generateDistractorsFlow = ai.defineFlow(
  {
    name: 'generateDistractorsFlow',
    inputSchema: GenerateDistractorsInputSchema,
    outputSchema: GenerateDistractorsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);