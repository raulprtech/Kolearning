'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const VerifyAnswerInputSchema = z.object({
    question: z.string().describe('The question that was asked.'),
    correctAnswer: z.string().describe('The correct answer to the question.'),
    userAnswer: z.string().describe("The learner's answer to the question."),
});
const VerifyAnswerOutputSchema = z.object({
    isCorrect: z.boolean().describe('Whether the user answer is considered correct.'),
    feedback: z.string().describe('A brief, one-sentence feedback for the learner explaining the result.'),
});
export async function verifyAnswer(input) {
    return verifyAnswerFlow(input);
}
const prompt = ai.definePrompt({
    name: 'verifyAnswerPrompt',
    input: { schema: VerifyAnswerInputSchema },
    output: { schema: VerifyAnswerOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.1,
        maxOutputTokens: 8192
    },
    prompt: `You are the Learning Box Tutor, an AI tutor. Your task is to evaluate a learner's answer to a question.
Compare the "Learner's Answer" to the "Correct Answer". The learner's answer doesn't need to be word-for-word identical, but it MUST contain the key concepts of the correct answer. Be strict but fair.
Your response must be in English.

Question: {{{question}}}
Correct Answer: {{{correctAnswer}}}
Learner's Answer: {{{userAnswer}}}

Based on your evaluation, determine if the answer is correct and provide a brief feedback message.`,
});
const verifyAnswerFlow = ai.defineFlow({
    name: 'verifyAnswerFlow',
    inputSchema: VerifyAnswerInputSchema,
    outputSchema: VerifyAnswerOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
