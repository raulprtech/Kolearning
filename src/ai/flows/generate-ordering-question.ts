// src/ai/flows/generate-ordering-question.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateOrderingInputSchema = z.object({
  context: z.string().describe('A paragraph or text describing a process, sequence, or a list of items with a clear order.'),
});

export type GenerateOrderingInput = z.infer<typeof GenerateOrderingInputSchema>;

const GenerateOrderingOutputSchema = z.object({
  question: z.string().describe('The instruction for the user, e.g., "Arrange the following steps in the correct order."'),
  items: z.array(z.string()).describe('An array of the items to be ordered, presented in a shuffled sequence.'),
  correctOrder: z.array(z.string()).describe('An array of the items in their correct sequence.'),
});

export type GenerateOrderingOutput = z.infer<typeof GenerateOrderingOutputSchema>;

export const generateOrderingQuestion = ai.defineFlow(
  {
    name: 'generateOrderingQuestion',
    inputSchema: GenerateOrderingInputSchema,
    outputSchema: GenerateOrderingOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert in instructional design. Your task is to create an ordering question from the provided text.
    Identify the distinct steps, events, or items in the text that have a clear chronological or logical sequence.
    
    Your response must be in Spanish.

    1.  Create a clear question or instruction for the user.
    2.  List the items in their correct order.
    3.  Create a shuffled version of that list.
    4.  Format the output as a JSON object.

    Context: "${input.context}"

    Example:
    Context: "To make coffee, first boil water, then grind the coffee beans, add the grounds to a filter, and finally pour the water over the grounds."
    Output:
    {
      "question": "Arrange the steps for making coffee in the correct order:",
      "items": ["Pour water over grounds", "Boil water", "Grind coffee beans", "Add grounds to filter"],
      "correctOrder": ["Boil water", "Grind coffee beans", "Add grounds to filter", "Pour water over grounds"]
    }
    `;

    const llmResponse = await ai.generate({
        prompt,
        model: 'gemini-1.5-flash',
        output: { schema: GenerateOrderingOutputSchema },
        config: { temperature: 0.3 },
    });

    if (!llmResponse?.output) {
        throw new Error("Failed to generate ordering question, output function is null.");
    }
    
    const output = llmResponse.output;
    if (output === null) {
        throw new Error("Failed to generate ordering question, output was null.");
    }
    return output;
  }
);
