'use server';
/**
 * @fileOverview Handles the live chat with Koli during a study session.
 *
 * - koliTutorChat - A function that handles the chat conversation.
 * - KoliTutorChatInput - The input type for the koliTutorChat function.
 * - KoliTutorChatOutput - The return type for the koliTutorChat function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const KoliTutorChatInputSchema = z.object({
    questionContext: z.string().describe("The flashcard question the user is currently studying."),
    answerContext: z.string().describe("The answer to the flashcard question for context."),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
    })).describe("The history of the conversation so far.")
});
const KoliTutorChatOutputSchema = z.object({
    response: z.string().describe('Koli\'s response to the user.'),
});
export async function koliTutorChat(input) {
    return koliTutorChatFlow(input);
}
const prompt = ai.definePrompt({
    name: 'koliTutorChatPrompt',
    input: { schema: KoliTutorChatInputSchema },
    output: { schema: KoliTutorChatOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.1,
        maxOutputTokens: 8192
    },
    prompt: `You are Koli, an expert AI tutor, currently in a live chat with a learner during a study session.
The learner is working on a specific question and has asked for your help. Your role is to guide them, clarify doubts, and provide deeper insights without simply giving away the answer.
All your responses must be in Spanish.

**Current Study Context:**
- Question: {{{questionContext}}}
- Answer (for your reference only): {{{answerContext}}}

**Conversation History:**
{{#each chatHistory}}
- {{role}}: {{{content}}}
{{/each}}

Based on the context and the conversation history, provide a helpful and encouraging response to the user's latest message.`,
});
const koliTutorChatFlow = ai.defineFlow({
    name: 'koliTutorChatFlow',
    inputSchema: KoliTutorChatInputSchema,
    outputSchema: KoliTutorChatOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
