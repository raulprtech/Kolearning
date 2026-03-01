
// src/ai/flows/kolearning-calibrate-plan.ts
'use server';

/**
 * @fileOverview Genkit flow for calibrating initial learning plans.
 * 
 * Generates plans with 4 learning phases:
 * - Calibración: MC-only diagnostic (5-10 atoms)
 * - Incursión: Comprehension via association + open-ended questions 
 * - Refuerzo: Analytical reasoning via hypothetical scenarios
 * - Prueba de Dominio: Mastery test adapted to knowledge type
 * 
 * IMPORTANT: Uses atom INDICES (0-based) instead of question text matching,
 * because LLMs cannot reliably copy exact text strings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AtomSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const CalibratePlanInputSchema = z.object({
  atoms: z.array(AtomSchema).describe('The complete list of knowledge atoms generated from the material.'),
  projectTitle: z.string().describe('The title for the learning project provided by the user.'),
});

export type CalibratePlanInput = z.infer<typeof CalibratePlanInputSchema>;

// --- Raw AI output schemas (relaxed types to tolerate AI flakiness) ---

const RawSessionSchema = z.object({
  session: z.number().describe('Sequential session number (1, 2, 3...).'),
  topic: z.string().describe('What the user will learn in this session.'),
  sessionType: z.string().describe('Session type: Calibración, Incursión, Refuerzo, or Prueba de Dominio.'),
  questions: z.string().describe('The question format description for this session.'),
  atomIndices: z.array(z.number()).describe('An array of 0-based indices referring to the atoms list. For example, [0, 3, 5] means atoms at positions 0, 3, and 5.'),
  numAtoms: z.number().optional().describe('Number of atoms for this session (5-20).'),
  phase: z.string().optional().describe('The learning phase: calibration, incursion, reinforcement, or mastery.'),
  questionFormats: z.string().optional().describe('Comma-separated question formats.'),
});

const RawCalibratePlanOutputSchema = z.object({
  projectDescription: z.string().describe('A brief, one-sentence description of the project.'),
  categories: z.array(z.string()).describe('An array of one to three relevant categories for the project.'),
  learningPath: z.array(z.object({
    day: z.number().describe("The day number, starting from 1."),
    sessions: z.array(RawSessionSchema).describe("An array of sessions for this specific day.")
  })).describe('The structured learning path with sessions grouped by day.'),
  kolearningJustification: z.string().optional().describe('Justification of the pedagogical strategy.'),
  expectedProgress: z.string().optional().describe('Encouraging paragraph about expected learning.'),
  fullLearningPlanMarkdown: z.string().optional().describe('The full learning plan in Markdown format.'),
});

// --- Final strict output schemas (for the rest of the application) ---

const SessionSchema = z.object({
  session: z.number(),
  topic: z.string(),
  sessionType: z.string(),
  questions: z.string(),
  atoms: z.array(AtomSchema),
  numAtoms: z.number(),
  phase: z.enum(['calibration', 'incursion', 'reinforcement', 'mastery']),
  questionFormats: z.string(),
});

const CalibratePlanOutputSchema = z.object({
  projectDescription: z.string(),
  categories: z.array(z.string()),
  atoms: z.array(AtomSchema),
  learningPath: z.array(z.object({
    day: z.number(),
    sessions: z.array(SessionSchema)
  })),
  kolearningJustification: z.string(),
  expectedProgress: z.string(),
  fullLearningPlanMarkdown: z.string(),
});


export type CalibratePlanOutput = z.infer<typeof CalibratePlanOutputSchema>;

export async function calibratePlanFromQuestionnaire(input: CalibratePlanInput): Promise<CalibratePlanOutput> {
  return calibratePlanFlow(input);
}

const calibratePlanPrompt = ai.definePrompt({
  name: 'calibratePlanPrompt',
  input: { schema: CalibratePlanInputSchema },
  output: { schema: RawCalibratePlanOutputSchema },
  model: 'googleai/gemini-2.5-flash-lite',
  config: {
    temperature: 0.1,
    maxOutputTokens: 8192
  },
  prompt: `You are the Kolearning Tutor, a Strategic AI Tutor designed to create personalized learning plans based on a deep pedagogical framework.

ALWAYS RESPOND IN ENGLISH.

The learner has provided their study material, which has been converted into "Knowledge Atoms," and has given a title to their project.

**Project Title:** {{{projectTitle}}}

## YOUR TASKS

### 1. Analyze and Define the Project
- Carefully review the atoms to understand the subject matter.
- Generate a concise one-sentence 'projectDescription'.
- Generate 1-3 appropriate 'categories'.

### 2. Create the Learning Plan

Generate a 'learningPath' structured by days. **Each session MUST have the fields 'numAtoms', 'phase', 'questionFormats', and 'atomIndices'.**

#### HOW TO REFERENCE ATOMS
- Atoms are numbered starting from 0. Use the 'atomIndices' field to indicate which atoms belong to each session.
- Example: If there are 22 atoms (indices 0-21), and a session uses atoms 0, 1, 2, 5, 7: atomIndices = [0, 1, 2, 5, 7]
- **DO NOT copy the question text.** Only use the numeric indices.

#### TOTAL COVERAGE REQUIREMENT
- **YOU MUST USE ALL provided ATOMS.** No atom should be left out of the learning plan.
- Distribute atoms logically across sessions:
    - **Calibration:** 5-10 representative atoms for diagnosis.
    - **Incursion:** Introduce atoms for the first time.
    - **Reinforcement:** Practice previously seen atoms to consolidate.
    - **Mastery Test:** Final evaluation of all project atoms.

#### MANDATORY PHASES AND FORMATS

| Phase | sessionType | phase | questionFormats | Purpose | numAtoms |
|---|---|---|---|---|---|
| **Calibration** | "Calibration" | "calibration" | "Multiple Choice" | Rapid diagnosis | 5-10 |
| **Incursion (1st half)** | "Incursion" | "incursion" | "Association, Open Question" | Deep understanding | 8-15 |
| **Incursion (2nd half)** | "Incursion" | "incursion" | "Fill in the Blanks, Classification" | Application | 8-15 |
| **Reinforcement** | "Reinforcement" | "reinforcement" | "Hypothetical Scenario, Multiple Choice" | Analytical reasoning | 10-15 |
| **Mastery Test** | "Mastery Test" | "mastery" | "Teach the Tutor, Open Question" | Evaluation and creation | 5-15 |

#### STRUCTURE RULES

1. **Day 1** always starts with a **Calibration** session (Multiple Choice only, 5-10 atoms).
2. After calibration, **Incursion** sessions follow to introduce new concepts.
3. **Reinforcement** sessions are interleaved or placed at the end for consolidation.
4. The **Mastery Test** is the last session of the plan.
5. Session numbers ('session') MUST be sequential integers (1, 2, 3...).
6. Distribute over 3-7 days for moderate-sized topics.
7. For each session, use 'atomIndices' with the corresponding atom indices.
8. The 'questions' field should describe the format (e.g., "Multiple Choice", "Open Question and Practical Cases").

#### SUB-MODULE LOGIC

If the material is extensive:
- Divide into thematic sub-modules.
- Each sub-module can have its own cycle: Incursion → Reinforcement.
- Calibration is global (only one at the start).
- The Mastery Test can be global or per sub-module if the material is very extensive.

### 3. Generate Justification and Progress
- **kolearningJustification:** Explain the pedagogical strategy and daily distribution.
- **expectedProgress:** Encouraging paragraph about expected learning.
- **fullLearningPlanMarkdown:** Full plan in Markdown with readable formatting.

## KNOWLEDGE ATOMS (Numbered from 0)

{{{atoms}}}

## CRITICAL REQUIREMENTS

- Use ONLY the provided atom indices. DO NOT create new atoms.
- EVERY session MUST have all fields: session, topic, sessionType, questions, atomIndices, numAtoms, phase, questionFormats.
- INCLUDE ALL output fields: projectDescription, categories, learningPath, kolearningJustification, expectedProgress, fullLearningPlanMarkdown.
- atomIndices MUST contain ONLY valid integers corresponding to the indices of the atoms listed above (starting from 0).

Respond in the specified JSON format.
  `,
});

const calibratePlanFlow = ai.defineFlow(
  {
    name: 'calibratePlanFlow',
    inputSchema: CalibratePlanInputSchema,
    outputSchema: CalibratePlanOutputSchema,
  },
  async (input) => {
    console.log('=== CALIBRATE PLAN INPUT ===');
    console.log('Atoms received:', input.atoms.length);
    console.log('Sample atoms:', input.atoms.slice(0, 3).map((a, i) => `[${i}] ${a.question}`));
    console.log('Project title:', input.projectTitle);

    // Format atoms with indices for the prompt
    const numberedInput = {
      ...input,
      atoms: input.atoms.map((a, i) => ({
        ...a,
        question: `[Átomo ${i}] ${a.question}`,
      })),
    };

    let output;
    try {
      const result = await calibratePlanPrompt(numberedInput);
      output = result.output;

      if (!output) {
        throw new Error('AI output was empty.');
      }
    } catch (e: any) {
      console.warn('⚠️ [PlanFlow] AI Genkit schema generation threw an error, using fallback learning plan:', e.message);

      // Fallback generator for large documents where Genkit times out or produces incomplete JSON
      const fallbackSessions = [];
      const sessionSize = 10;
      let sessionCounter = 1;

      // Calibracion uses first 10 atoms
      const maxCalibracion = Math.min(10, input.atoms.length);
      fallbackSessions.push({
        session: sessionCounter++,
        topic: "Initial Diagnosis",
        sessionType: "Calibration",
        questions: "Multiple Choice",
        atomIndices: Array.from({ length: maxCalibracion }, (_, i) => i),
        numAtoms: maxCalibracion,
        phase: "calibration",
        questionFormats: "Multiple Choice"
      });

      // Split remaining atoms into Incursion sessions
      for (let i = 0; i < input.atoms.length; i += sessionSize) {
        const chunkLength = Math.min(sessionSize, input.atoms.length - i);
        const chunkIndices = Array.from({ length: chunkLength }, (_, j) => i + j);
        fallbackSessions.push({
          session: sessionCounter++,
          topic: `Incursion Module ${Math.floor(i / sessionSize) + 1}`,
          sessionType: "Incursion",
          questions: "Association, Open Question",
          atomIndices: chunkIndices,
          numAtoms: chunkLength,
          phase: "incursion",
          questionFormats: "Association, Open Question"
        });
      }

      output = {
        projectDescription: `Structured study plan for: ${input.projectTitle}`,
        categories: ["Study", "General"],
        learningPath: [{
          day: 1,
          sessions: fallbackSessions
        }],
        kolearningJustification: "Plan organized sequentially to ensure steady assimilation of each atom extracted from the extensive material.",
        expectedProgress: "By advancing session by session, you will master all the fundamental concepts.",
        fullLearningPlanMarkdown: `# Study Plan: ${input.projectTitle}\n\nPlan generated with ${fallbackSessions.length} sessions.`
      };
    }

    // Process learning path: resolve indices to actual atoms
    const processedLearningPath = output.learningPath.map(day => ({
      ...day,
      sessions: day.sessions.map(session => {
        // Resolve atom indices to actual atoms
        const validIndices = (session.atomIndices || []).filter(
          idx => typeof idx === 'number' && idx >= 0 && idx < input.atoms.length
        );

        const invalidIndices = (session.atomIndices || []).filter(
          idx => typeof idx !== 'number' || idx < 0 || idx >= input.atoms.length
        );

        if (invalidIndices.length > 0) {
          console.warn(`[PlanFlow] Session ${session.session}: ${invalidIndices.length} invalid indices: ${invalidIndices.join(', ')}`);
        }

        const hydratedAtoms = validIndices.map(idx => input.atoms[idx]);

        console.log(`[PlanFlow] Session ${session.session}: ${hydratedAtoms.length} atoms hydrated from indices [${validIndices.join(', ')}]`);

        // Infer phase from sessionType if missing or invalid
        const rawPhase = session.phase?.toLowerCase().trim() || '';
        let phase: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';

        if (['calibration', 'incursion', 'reinforcement', 'mastery'].includes(rawPhase)) {
          phase = rawPhase as 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
        } else {
          const type = session.sessionType.toLowerCase();
          if (type.includes('calibration')) phase = 'calibration';
          else if (type.includes('incursion')) phase = 'incursion';
          else if (type.includes('reinforcement')) phase = 'reinforcement';
          else if (type.includes('mastery')) phase = 'mastery';
          else phase = 'incursion'; // Default
        }

        // Infer questionFormats if missing
        let questionFormats = session.questionFormats;
        if (!questionFormats) {
          if (phase === 'calibration') questionFormats = 'Multiple Choice';
          else if (phase === 'incursion') questionFormats = 'Association, Open Question';
          else if (phase === 'reinforcement') questionFormats = 'Hypothetical Scenario, Multiple Choice';
          else if (phase === 'mastery') questionFormats = 'Teach the Tutor, Open Question';
          else questionFormats = 'Multiple Choice';
        }

        return {
          session: session.session,
          topic: session.topic,
          sessionType: session.sessionType,
          questions: session.questions,
          atoms: hydratedAtoms,
          numAtoms: hydratedAtoms.length,
          phase,
          questionFormats,
        };
      })
    }));

    console.log('=== CALIBRATE PLAN OUTPUT ===');
    const totalSessions = processedLearningPath.flatMap(day => day.sessions).length;
    const totalHydratedAtoms = processedLearningPath.flatMap(day => day.sessions).reduce((acc, s) => acc + s.atoms.length, 0);
    console.log(`Learning path: ${totalSessions} sessions, ${totalHydratedAtoms} total atom assignments`);

    // Ensure required fields have defaults if the AI omitted them
    const result: CalibratePlanOutput = {
      ...output,
      atoms: input.atoms, // Keep full atoms at top level
      learningPath: processedLearningPath,
      kolearningJustification: output.kolearningJustification || 'Automatically generated plan by Kolearning.',
      expectedProgress: output.expectedProgress || 'Expected progress based on the study plan.',
      fullLearningPlanMarkdown: output.fullLearningPlanMarkdown || '',
    };

    return result;
  }
);
