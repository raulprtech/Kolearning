'use server';
/**
 * @fileOverview Implements the AI Strategic Tutor fl4.  **Define Adjustments:**
    *   Translate your strategy into concrete actions in the 'adjustments' object.
    *   **Determine Session Size:** For each session you add or update, you MUST decide the optimal number of knowledge atoms ('numAtoms'). This should be based on the session's purpose (e.g., a quick review might have 5-7 atoms, while a deep dive into a new topic could have 15-20). Justify this number implicitly through your reasoning.
    *   **add:** If you need to add a new session (e.g., for reinforcement), specify its content, size (`numAtoms`), and where it should be inserted (`afterSession`).
    *   **update:** If a future session needs a change of focus, specify the session number and its new content, including the updated size (`numAtoms`).
    *   **remove:** If a future session is no longer needed, specify its session number to be removed.
    *   If no changes are needed, return empty arrays for 'add', 'update', and 'remove'.ich analyzes FSRS data and performance history to dynamically adjust learning paths.
 *
 * - dynamicLearningPathAdjustment - Adjusts the learning path based on FSRS data and performance.
 * - DynamicLearningPathAdjustmentInput - The input type for the dynamicLearningPathAdjustment function.
 * - DynamicLearningPathAdjustmentOutput - The return type for the dynamicLearningPathAdjustment function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const DynamicLearningPathAdjustmentInputSchema = z.object({
    fsrsData: z.string().describe('A JSON string representing FSRS data (Difficulty, Stability, Retrievability) for each knowledge atom.'),
    performanceHistory: z.string().describe('A JSON string detailing the learner\'s performance history over multiple sessions, including accuracy, streaks, and topics covered.'),
    currentLearningPlan: z.string().describe('The current learning plan of the learner as a JSON string, including all scheduled sessions.'),
    tutorLog: z.string().describe('A log of past tutor decisions and reasoning, providing long-term memory. Can be empty.'),
});
const SessionAdjustmentSchema = z.object({
    type: z.string().describe('The type of the session (e.g., Refuerzo, Dominio, Introducción).'),
    questions: z.string().describe('A brief description of the questions format (e.g., Opción múltiple, Preguntas abiertas).'),
    duration: z.string().describe('The estimated duration of the session (e.g., 20 min).'),
    topic: z.string().describe('A specific, concise topic for the session (e.g., "Ecuaciones de primer grado", "Fotosíntesis").'),
    numAtoms: z.number().describe('The optimal number of knowledge atoms for this session, based on the topic complexity and user performance. Should be between 5 and 20.'),
});
const DynamicLearningPathAdjustmentOutputSchema = z.object({
    feedback: z.string().describe('A brief, encouraging, and insightful feedback message for the user based on their performance and progress.'),
    reasoning: z.string().describe('A detailed explanation of the reasoning behind the proposed adjustments, analyzing trends from performanceHistory and consulting the tutorLog to justify the changes.'),
    adjustments: z.object({
        add: z.array(SessionAdjustmentSchema.extend({
            afterSession: z.number().describe('The session number after which this new session should be inserted.')
        })).optional().describe('An array of new sessions to be added to the learning plan.'),
        update: z.array(SessionAdjustmentSchema.extend({
            session: z.number().describe('The session number of the existing session to update.')
        })).optional().describe('An array of existing sessions to be updated with new content or focus.'),
        remove: z.array(z.number()).optional().describe('An array of session numbers to be removed from the learning plan if they are deemed unnecessary or redundant.'),
    }).describe('The proposed adjustments to the learning plan. The tutor can add, update, or remove sessions.'),
});
export async function dynamicLearningPathAdjustment(input) {
    return dynamicLearningPathAdjustmentFlow(input);
}
const prompt = ai.definePrompt({
    name: 'dynamicLearningPathAdjustmentPrompt',
    input: { schema: DynamicLearningPathAdjustmentInputSchema },
    output: { schema: DynamicLearningPathAdjustmentOutputSchema },
    model: 'googleai/gemini-2.5-flash-lite',
    config: {
        temperature: 0.1,
        maxOutputTokens: 8192
    },
    prompt: `You are Koli, an expert AI Strategic Tutor. Your primary role is to analyze a learner's performance after a study session and dynamically adapt their learning plan for optimal long-term retention.
Your response must be in Spanish.

The user has just finished a study session. You must analyze their detailed performance history, their FSRS data, their current plan, and your own past decisions (the tutor log) to make strategic adjustments.

**Your Tasks:**

1.  **Analyze All Data:**
    *   **Performance History:** Look for trends. Is the user consistently struggling with a specific topic? Is their accuracy improving or declining?
    *   **FSRS Data:** Identify atoms with low retrievability or high difficulty. These are prime candidates for reinforcement.
    *   **Current Learning Plan:** Understand the upcoming sessions. Are they still relevant based on the latest performance?
    *   **Tutor Log:** Review your past decisions. Why did you make those changes? Are they working? Avoid contradicting your past self without a good reason.
    *   **CRITICAL:** If the user's overall session accuracy is below 70%, you MUST add reinforcement sessions before allowing them to continue to the final mastery test.

2.  **Formulate a Strategy and Reasoning:**
    *   Based on your analysis, formulate a clear strategy. For example: "The user is struggling with 'X', so I will insert a reinforcement session. They have mastered 'Y', so I will remove a redundant future session."
    *   **Reinforcement Strategy:** If accuracy is below 70% or if there are multiple atoms with low FSRS retrievability (<60%), add 2-3 reinforcement sessions focusing on the weakest concepts.
    *   **Never allow completion:** Do NOT allow the user to reach the final "Prueba de Dominio" session if their overall mastery is below 80%. Add reinforcement sessions until they demonstrate competency.
    *   Articulate this strategy in the 'reasoning' field. Be clear and concise. This is your internal monologue that justifies your actions.

3.  **Provide Encouraging Feedback:**
    *   Write a short, insightful, and encouraging 'feedback' message for the learner. Connect it to their recent performance and your plan. For example: "¡Gran trabajo en la última sesión! Noté que dominas 'Z', así que ajustaré tu plan para que nos enfoquemos en los conceptos que aún son un desafío."

4.  **Define Adjustments:**
    *   Translate your strategy into concrete actions in the 'adjustments' object.
    *   **add:** If you need to add a new session (e.g., for reinforcement), specify its content and where it should be inserted (\`afterSession\`).
    *   **update:** If a future session needs a change of focus, specify the session number and its new content.
    *   **remove:** If a future session is no longer needed, specify its session number to be removed.
    *   **IMPORTANT:** For reinforcement sessions (type "Refuerzo"), NEVER use "Preguntas abiertas" as the questions format. Use only "Opción múltiple" or "Ordenamiento" for reinforcement sessions.
    *   If no changes are needed, return empty arrays for 'add', 'update', and 'remove'.

**User Data:**

-   **FSRS Data:** {{{fsrsData}}}
-   **Performance History:** {{{performanceHistory}}}
-   **Current Learning Plan:** {{{currentLearningPlan}}}
-   **Tutor Log:** {{{tutorLog}}}

Provide your response in the specified JSON format. Be thoughtful and strategic. Your goal is to create the most efficient and effective learning path possible.
  `,
});
const dynamicLearningPathAdjustmentFlow = ai.defineFlow({
    name: 'dynamicLearningPathAdjustmentFlow',
    inputSchema: DynamicLearningPathAdjustmentInputSchema,
    outputSchema: DynamicLearningPathAdjustmentOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
