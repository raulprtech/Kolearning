// src/ai/flows/tutor-chat.ts
'use server';
/**
 * @fileOverview A conversational tutor AI agent.
 *
 * - chatWithTutor - A function that handles the conversation with the tutor.
 * - ChatWithTutorInput - The input type for the chatWithTutor function.
 * - ChatWithTutorOutput - The return type for the chatWithTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithTutorInputSchema = z.object({
  message: z.string().describe('The message from the user to the tutor.'),
});
export type ChatWithTutorInput = z.infer<typeof ChatWithTutorInputSchema>;

const ChatWithTutorOutputSchema = z.object({
  response: z.string().describe('The response from the tutor.'),
});
export type ChatWithTutorOutput = z.infer<typeof ChatWithTutorOutputSchema>;

export async function chatWithTutor(input: ChatWithTutorInput): Promise<ChatWithTutorOutput> {
  return chatWithTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithTutorPrompt',
  input: {schema: ChatWithTutorInputSchema},
  output: {schema: ChatWithTutorOutputSchema},
  prompt: `You are a helpful AI tutor. Respond to the user's message with helpful and informative answers.

User message: {{{message}}}`,
});

const chatWithTutorFlow = ai.defineFlow(
  {
    name: 'chatWithTutorFlow',
    inputSchema: ChatWithTutorInputSchema,
    outputSchema: ChatWithTutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
