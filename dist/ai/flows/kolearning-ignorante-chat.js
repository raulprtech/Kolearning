'use server';
/**
 * @fileOverview AI flow for the "Kolearning Ignorante" mastery test mode.
 * Kolearning pretends not to know a concept and the user must teach it.
 * After 3-5 exchanges, Kolearning evaluates whether the user demonstrated true mastery.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const KolearningIgnoranteInputSchema = z.object({
    concept: z.string().describe('The concept the user should be teaching.'),
    expectedExplanation: z.string().describe('The expected correct explanation of the concept.'),
    conversationHistory: z.string().describe('JSON string of the conversation messages so far.'),
    exchangeCount: z.number().describe('How many exchanges have occurred (1 exchange = 1 user message).'),
    shouldEvaluate: z.boolean().describe('Whether Kolearning should perform a final mastery evaluation.'),
});
const KolearningIgnoranteOutputSchema = z.object({
    response: z.string().describe('Kolearning\'s response message in the conversation.'),
    evaluationDone: z.boolean().describe('Whether Kolearning has completed its mastery evaluation.'),
    mastered: z.boolean().describe('Whether the user demonstrated mastery of the concept.'),
    evaluationFeedback: z.string().optional().describe('Detailed feedback on the user\'s teaching performance if evaluationDone is true.'),
});
export async function kolearningIgnoranteRespond(input) {
    return kolearningIgnoranteFlow(input);
}
const kolearningIgnorantePrompt = ai.definePrompt({
    name: 'kolearningIgnorantePrompt',
    input: { schema: KolearningIgnoranteInputSchema },
    output: { schema: KolearningIgnoranteOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.4,
        maxOutputTokens: 2048,
    },
    prompt: `You are the Kolearning Tutor in "Ignorant" mode. You are pretending that you know NOTHING about a concept, and a student is teaching you. Your goal is to:

1. **Ask genuinely curious questions** that force the student to explain in depth.
2. **Detect superficial explanations** and kindly ask for more detail.
3. **Evaluate if the student truly masters the topic** after 3-5 exchanges.

ALWAYS RESPOND IN ENGLISH.

## PERSONA

- You are curious, enthusiastic, but genuinely lost on the subject.
- Ask questions like: "But what does that exactly mean?", "And why doesn't it work another way?", "Could you give me an example?"
- NEVER reveal that you actually know the answer.
- Use emojis moderately to seem accessible (🤔, 💡, 🙏).

## EFFECTIVE PROBING QUESTIONS

Types of questions to test deep understanding:
- **Definition:** "What exactly is X?"
- **Cause:** "Why does it work like that?"
- **Contrast:** "And what is the difference between X and Y?"
- **Application:** "Can you give me a concrete example?"
- **Limits:** "When does this NOT apply?"
- **Connection:** "How does this relate to Z?"

## EVALUATION (when shouldEvaluate is true)

Evaluate if the student demonstrated:
1. ✅ Correct understanding of the concept
2. ✅ Ability to explain in their own words
3. ✅ Ability to give relevant examples
4. ✅ Understanding of limits or exceptions

**mastered = true** if they meet at least 3 of the 4 criteria.

If shouldEvaluate is true:
- FIRST give a natural response that closes the conversation by thanking the user.
- SET evaluationDone = true
- SET mastered = true/false based on the criteria
- SET evaluationFeedback with a detailed summary

If shouldEvaluate is false:
- Ask a probing question to go deeper
- SET evaluationDone = false and mastered = false

## DATA

- **Concept to teach:** {{{concept}}}
- **Expected explanation:** {{{expectedExplanation}}}
- **Conversation history:** {{{conversationHistory}}}
- **Exchange number:** {{{exchangeCount}}}
- **Should evaluate?:** {{{shouldEvaluate}}}

Respond in the specified JSON format.
`,
});
const kolearningIgnoranteFlow = ai.defineFlow({
    name: 'kolearningIgnoranteFlow',
    inputSchema: KolearningIgnoranteInputSchema,
    outputSchema: KolearningIgnoranteOutputSchema,
}, async (input) => {
    const { output } = await kolearningIgnorantePrompt(input);
    return output;
});
