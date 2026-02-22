
'use server';
/**
 * @fileOverview AI Strategic Tutor with intelligent failure diagnosis.
 * 
 * Analyzes FSRS data and performance to dynamically adjust learning paths.
 * Features a 4-type failure diagnosis system:
 * - conceptual_confusion → mini-session for comprehension
 * - missing_prerequisite → prioritize dependency atoms
 * - surface_error → adjust FSRS frequency without interrupting flow
 * - systematic_failure → return to calibration with positive framing
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicLearningPathAdjustmentInputSchema = z.object({
  fsrsData: z.string().describe('A JSON string representing FSRS data (Difficulty, Stability, Retrievability) for each knowledge atom.'),
  performanceHistory: z.string().describe('A JSON string detailing the learner\'s performance history over multiple sessions, including accuracy, streaks, and topics covered.'),
  currentLearningPlan: z.string().describe('The current learning plan of the learner as a JSON string, including all scheduled sessions with their phases.'),
  tutorLog: z.string().describe('A log of past tutor decisions and reasoning, providing long-term memory. Can be empty.'),
});
export type DynamicLearningPathAdjustmentInput = z.infer<typeof DynamicLearningPathAdjustmentInputSchema>;

const FailureDiagnosisSchema = z.object({
  type: z.enum([
    'conceptual_confusion',
    'missing_prerequisite',
    'surface_error',
    'systematic_failure',
    'no_failure'
  ]).describe('The diagnosed type of failure based on error pattern analysis.'),
  affectedAtoms: z.array(z.string()).describe('The questions/topics of the atoms where the learner is struggling.'),
  recommendedAction: z.string().describe('The specific pedagogical action to take based on the diagnosis.'),
  positiveMessage: z.string().describe('An encouraging message framing the situation positively, never blaming the user.'),
});

const SessionAdjustmentSchema = z.object({
  type: z.string().describe('The type of the session (e.g., Reinforcement, Mastery, Incursion, Calibration).'),
  questions: z.string().describe('A brief description of the questions format (e.g., Multiple Choice, Association, Hypothetical Scenario).'),
  duration: z.string().describe('The estimated duration of the session (e.g., 20 min).'),
  topic: z.string().describe('A specific, concise topic for the session.'),
  numAtoms: z.number().describe('The optimal number of knowledge atoms for this session (5-20).'),
  phase: z.enum(['calibration', 'incursion', 'reinforcement', 'mastery']).describe('The learning phase this session belongs to.'),
  questionFormats: z.string().describe('Comma-separated list of question formats for this session (e.g., "Multiple Choice", "Association, Brief Open Question", "Hypothetical Scenario").'),
});

const DynamicLearningPathAdjustmentOutputSchema = z.object({
  feedback: z.string().describe('A brief, encouraging, and insightful feedback message for the user.'),
  reasoning: z.string().describe('Detailed explanation of the reasoning behind the proposed adjustments.'),
  failureDiagnosis: FailureDiagnosisSchema.describe('Diagnosis of the type of failure the learner is experiencing, if any.'),
  adjustments: z.object({
    add: z.array(SessionAdjustmentSchema.extend({
      afterSession: z.number().describe('The session number after which this new session should be inserted.')
    })).optional().describe('New sessions to add to the learning plan.'),
    update: z.array(SessionAdjustmentSchema.extend({
      session: z.number().describe('The session number of the existing session to update.')
    })).optional().describe('Existing sessions to update with new content or focus.'),
    remove: z.array(z.number()).optional().describe('Session numbers to remove from the learning plan.'),
  }).describe('The proposed adjustments to the learning plan.'),
});
export type DynamicLearningPathAdjustmentOutput = z.infer<typeof DynamicLearningPathAdjustmentOutputSchema>;

export async function dynamicLearningPathAdjustment(input: DynamicLearningPathAdjustmentInput): Promise<DynamicLearningPathAdjustmentOutput> {
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
  prompt: `You are the Learning Box Tutor, an expert Strategic AI Tutor. Your primary role is to analyze the learner's performance after a study session and dynamically adapt their learning plan.

ALWAYS RESPOND IN ENGLISH.

## LEARNING PHASES SYSTEM

The learning plan consists of 4 phases, each with specific question formats:

| Phase | Session Type | Allowed Formats | Purpose |
|---|---|---|---|
| **calibration** | Calibration | Multiple Choice (only) | Rapid initial diagnosis |
| **incursion** | Incursion | Association, Brief Open Questions, Fill in the Blanks, Classification | Deep understanding and application |
| **reinforcement** | Reinforcement | Hypothetical Scenario, Contextualized Multiple Choice | Analytical reasoning |
| **mastery** | Mastery Test | Teach the Tutor, Project, Design a Session | Evaluation and creation |

## INTELLIGENT FAILURE DIAGNOSIS

**BEFORE deciding on adjustments, DIAGNOSE the learner's failure type:**

### 1. Conceptual Confusion (conceptual_confusion)
- **Signals:** Errors in atoms of the SAME topic/cluster, answers that mix related concepts, the learner gives answers that would be correct for ANOTHER atom of the same topic.
- **Action:** Insert a comprehension mini-session ("incursion" phase) with association questions to clarify relationships between confused concepts. DO NOT recalibrate.
- **Positive Message:** "I notice you're working with closely related concepts — it's normal to get them mixed up at first. Let's do an association activity to help you differentiate them better."

### 2. Missing Prerequisite (missing_prerequisite)
- **Signals:** Errors in atoms that depend on other atoms the learner has NOT mastered yet (FSRS retrievability < 60% on prerequisite atoms), errors in advanced concepts but correct answers in basic concepts of the same topic.
- **Action:** Prioritize prerequisite atoms before continuing with advanced ones. Reorder the plan to cover the dependency first. DO NOT add unnecessary extra sessions.
- **Positive Message:** "You have an excellent foundation! We just need to reinforce a couple of fundamental concepts before moving to the next level."

### 3. Surface Error / Lack of Focus (surface_error)
- **Signals:** Sporadic errors without a pattern, the learner sometimes gets the SAME type of atom right and sometimes wrong, errors in atoms they previously answered correctly.
- **Action:** Adjust review frequency via FSRS (reduce stability) WITHOUT interrupting the plan flow. Do not add extra sessions. The learner simply needs to see them more often.
- **Positive Message:** "Great job! I've just adjusted the review frequency of some concepts to ensure they stay fresh in your mind."

### 4. Systematic Failure (systematic_failure)
- **Signals:** Overall accuracy < 40% consistently (2+ sessions), the learner fails across multiple UNRELATED topics, accuracy trend is downward.
- **Action:** ONLY in this case, return to calibration. BUT use extremely positive language without the user perceiving it as a punishment. Frame it as "discovering opportunities."
- **Positive Message:** "I've discovered a great opportunity! It looks like we can optimize your learning path. Let's do a quick analysis to further personalize your experience."

### 5. No Failure (no_failure)
- **Signals:** Accuracy >= 70%, stable or upward trend, the learner is progressing as expected.
- **Action:** Continue with the current plan. Optionally, accelerate if accuracy > 90%.

## CRITICAL RULES

1. **NEVER use punitive language.** Prohibited phrases: "you need to improve", "you must study more", "you have failed at", "you could try harder". ALWAYS frame difficulties as learning opportunities.
2. **NEVER put "Open Questions" in "reinforcement" phase sessions.** Allowed formats per phase are listed above.
3. **NEVER allow progression to "mastery" if overall accuracy is < 80%.**
4. **Failure diagnosis is MANDATORY** — always complete the failureDiagnosis field, even if the type is "no_failure".
5. **Each new session MUST have phase and questionFormats** assigned correctly according to the phases table.

## USER DATA

- **FSRS Data:** {{{fsrsData}}}
- **Performance History:** {{{performanceHistory}}}
- **Current Learning Plan:** {{{currentLearningPlan}}}
- **Tutor Log:** {{{tutorLog}}}

## INSTRUCTIONS

1. **Analyze** all data: FSRS, history, current plan, and tutor log.
2. **Diagnose** the failure type using the described signals.
3. **Formulate** your strategy and explain it in the "reasoning" field.
4. **Write** positive and personalized feedback in "feedback".
5. **Define** concrete adjustments with correct sessions per phase.

Respond in the specified JSON format. Be strategic and empathetic.
  `,
});

const dynamicLearningPathAdjustmentFlow = ai.defineFlow(
  {
    name: 'dynamicLearningPathAdjustmentFlow',
    inputSchema: DynamicLearningPathAdjustmentInputSchema,
    outputSchema: DynamicLearningPathAdjustmentOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
