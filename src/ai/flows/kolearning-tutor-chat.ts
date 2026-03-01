
'use server';
/**
 * @fileOverview Handles the live chat with Kolearning during a study session.
 *
 * - kolearningTutorChat - A function that handles the chat conversation.
 * - KolearningTutorChatInput - The input type for the kolearningTutorChat function.
 * - KolearningTutorChatOutput - The return type for the kolearningTutorChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KolearningTutorChatInputSchema = z.object({
  questionContext: z.string().describe("The flashcard question the user is currently studying."),
  answerContext: z.string().describe("The answer to the flashcard question for context."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe("The history of the conversation so far.")
});
export type KolearningTutorChatInput = z.infer<typeof KolearningTutorChatInputSchema>;

const KolearningTutorChatOutputSchema = z.object({
  response: z.string().describe('Kolearning\'s response to the user.'),
});
export type KolearningTutorChatOutput = z.infer<typeof KolearningTutorChatOutputSchema>;

export async function kolearningTutorChat(input: KolearningTutorChatInput): Promise<KolearningTutorChatOutput> {
  return kolearningTutorChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'kolearningTutorChatPrompt',
  input: { schema: KolearningTutorChatInputSchema },
  output: { schema: KolearningTutorChatOutputSchema },
  model: 'googleai/gemini-2.5-flash-lite',
  config: {
    temperature: 0.1,
    maxOutputTokens: 8192
  },
  prompt: `You are the Kolearning Tutor, an expert AI tutor, currently in a live chat with a learner during a study session.
The learner is working on a specific question and has asked for your help. Your role is to guide them, clarify doubts, and provide deeper insights without simply giving away the answer.
All your responses must be in English.

**Current Study Context:**
- Question: {{{questionContext}}}
- Answer (for your reference only): {{{answerContext}}}

**Conversation History:**
{{#each chatHistory}}
- {{role}}: {{{content}}}
{{/each}}

Based on the context and the conversation history, provide a helpful and encouraging response to the user's latest message.`,
});

const kolearningTutorChatFlow = ai.defineFlow(
  {
    name: 'kolearningTutorChatFlow',
    inputSchema: KolearningTutorChatInputSchema,
    outputSchema: KolearningTutorChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
