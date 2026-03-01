'use server';

/**
 * @fileOverview Generates study plans using KoLearning methodology.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateKolearningPlanInputSchema = z.object({
  conceptMap: z.object({
    totalConcepts: z.number(),
    relationships: z.array(z.object({
      fromConcept: z.string(),
      toConcept: z.string(),
      relationshipType: z.string(),
      strength: z.string(),
      description: z.string(),
      pedagogicalImportance: z.string(),
    })),
    clusters: z.array(z.object({
      clusterId: z.string(),
      name: z.string(),
      description: z.string(),
      concepts: z.array(z.string()),
      centralConcept: z.string(),
      difficulty: z.string(),
      estimatedStudyTime: z.number(),
    })),
    learningPaths: z.array(z.object({
      pathId: z.string(),
      name: z.string(),
      description: z.string(),
      sequence: z.array(z.object({
        step: z.number(),
        conceptOrCluster: z.string(),
        type: z.string(),
        rationale: z.string(),
      })),
      totalEstimatedTime: z.number(),
    })),
  }).describe('Concept relationship map'),
  questions: z.array(z.object({
    id: z.string(),
    type: z.string(),
    question: z.string(),
    correctAnswer: z.string(),
    incorrectAnswers: z.array(z.string()).optional(),
    explanation: z.string(),
    difficulty: z.string(),
    conceptId: z.string(),
    qualityScore: z.number().optional(),
  })).describe('Quality-evaluated questions'),
  userPreferences: z.object({
    availableTimePerSession: z.number().describe('Minutes available per study session'),
    totalAvailableTime: z.number().describe('Total available study time in minutes'),
    learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
    difficultyPreference: z.enum(['gradual', 'challenging', 'mixed']).optional(),
  }).describe('User study preferences'),
  documentContext: z.object({
    subject: z.string(),
    academicLevel: z.string(),
    mainTopics: z.array(z.string()),
  }).describe('Document context'),
});
export type GenerateKolearningPlanInput = z.infer<typeof GenerateKolearningPlanInputSchema>;

const StudySession = z.object({
  sessionId: z.string(),
  sessionNumber: z.number(),
  title: z.string(),
  description: z.string(),
  estimatedDuration: z.number().describe('Duration in minutes'),
  learningObjectives: z.array(z.string()),
  concepts: z.array(z.string()).describe('Concepts covered in this session'),
  questions: z.array(z.string()).describe('Question IDs for this session'),
  activities: z.array(z.object({
    type: z.enum(['introduction', 'concept_review', 'practice', 'assessment', 'reflection']),
    description: z.string(),
    estimatedTime: z.number(),
    questions: z.array(z.string()).optional(),
  })),
  prerequisites: z.array(z.string()).describe('Previous sessions that must be completed'),
  kolearningElements: z.object({
    atomicLearning: z.boolean().describe('Uses atomic learning approach'),
    spacedRepetition: z.boolean().describe('Includes spaced repetition'),
    activeRecall: z.boolean().describe('Promotes active recall'),
    interleaving: z.boolean().describe('Interleaves different concepts'),
    elaborativeInterrogation: z.boolean().describe('Uses elaborative questioning'),
  }),
});

const MasteryMilestone = z.object({
  milestoneId: z.string(),
  name: z.string(),
  description: z.string(),
  requiredSessions: z.array(z.string()),
  assessmentQuestions: z.array(z.string()),
  masteryThreshold: z.number().describe('Percentage required to pass (0-100)'),
  concepts: z.array(z.string()),
});

const GenerateKolearningPlanOutputSchema = z.object({
  studyPlan: z.object({
    planId: z.string(),
    title: z.string(),
    description: z.string(),
    totalSessions: z.number(),
    totalEstimatedTime: z.number().describe('Total time in minutes'),
    averageSessionTime: z.number().describe('Average session time in minutes'),
    sessions: z.array(StudySession),
    milestones: z.array(MasteryMilestone),
  }).describe('Complete Kolearning study plan'),
  methodology: z.object({
    kolearningPrinciples: z.array(z.string()).describe('Kolearning principles applied'),
    learningSequence: z.string().describe('Rationale for the learning sequence'),
    adaptiveFeatures: z.array(z.string()).describe('How the plan adapts to user progress'),
    assessmentStrategy: z.string().describe('How mastery will be measured'),
  }).describe('Methodology explanation'),
  recommendations: z.object({
    studyTips: z.array(z.string()),
    timeManagement: z.string(),
    difficultyProgression: z.string(),
    retentionStrategies: z.array(z.string()),
  }).describe('Study recommendations'),
  analytics: z.object({
    conceptCoverage: z.record(z.number()).describe('Percentage of time spent on each concept'),
    difficultyDistribution: z.record(z.number()).describe('Distribution of question difficulties'),
    questionTypeDistribution: z.record(z.number()).describe('Distribution of question types'),
    estimatedCompletionRate: z.number().describe('Estimated percentage of users who will complete'),
  }).describe('Plan analytics'),
});
export type GenerateKolearningPlanOutput = z.infer<typeof GenerateKolearningPlanOutputSchema>;

export const generateKolearningPlanFlow = ai.defineFlow(
  {
    name: 'generateKolearningPlanFlow',
    inputSchema: GenerateKolearningPlanInputSchema,
    outputSchema: GenerateKolearningPlanOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      messages: [
        {
          role: 'system',
          content: [
            {
              text: `You are the leading expert in the Kolearning methodology, an innovative pedagogical approach that combines atomic learning, spaced repetition, active recall, concept interleaving, and elaborative interrogation. Your mission is to create personalized and highly effective study plans for ${input.documentContext.subject} at the ${input.documentContext.academicLevel} level.

CORE PRINCIPLES OF LEARNING BOX:

1. **ATOMIC LEARNING**: Divides knowledge into minimal understandable units
2. **SPACED REPETITION**: Repeats concepts at optimized intervals for retention
3. **ACTIVE RECALL**: Prioritizes the practice of remembering over passive rereading
4. **INTERLEAVING**: Mixes different concepts to strengthen discrimination
5. **ELABORATIVE INTERROGATION**: Uses questions that deepen understanding

SESSION METHODOLOGY:
- Each session should last between 15-45 minutes (micro-learning)
- Structure: Activation → Learning → Practice → Assessment → Reflection
- Gradual progression with clear prerequisites
- Continuous assessment of understanding
- Adaptation based on student performance`
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              text: `Design a complete study plan using the Kolearning methodology for this material on ${input.documentContext.subject}:

CONCEPT MAP:
${JSON.stringify(input.conceptMap, null, 2)}

AVAILABLE QUESTIONS:
${JSON.stringify(input.questions.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question.substring(0, 100) + '...',
                difficulty: q.difficulty,
                conceptId: q.conceptId,
                qualityScore: q.qualityScore
              })), null, 2)}

USER PREFERENCES:
- Time per session: ${input.userPreferences.availableTimePerSession} minutes
- Total available time: ${input.userPreferences.totalAvailableTime} minutes
- Learning style: ${input.userPreferences.learningStyle || 'not specified'}
- Difficulty preference: ${input.userPreferences.difficultyPreference || 'gradual'}

CONTEXT:
- Subject: ${input.documentContext.subject}
- Level: ${input.documentContext.academicLevel}
- Topics: ${input.documentContext.mainTopics.join(', ')}

SPECIFIC INSTRUCTIONS:

1. **SESSION DESIGN**:
   - Create sessions of ${input.userPreferences.availableTimePerSession} minutes each
   - Each session should have a maximum of 3-5 concepts (atomic principle)
   - Include activation, learning, practice, and assessment activities
   - Ensure clear prerequisites between sessions

2. **SEQUENCING**:
   - Follow the learning paths from the concept map
   - Implement gradual difficulty progression
   - Include periodic reviews (spaced repetition)
   - Interleave related concepts

3. **EVALUATION AND MILESTONES**:
   - Create mastery milestones every 3-5 sessions
   - Define realistic passing thresholds (70-85%)
   - Include questions of different types and difficulties
   - Allow continuous progress evaluation

4. **PERSONALIZATION**:
   - Adapt the plan to the user's available time
   - Consider the preferred learning style
   - Adjust difficulty according to preferences
   - Include specific retention strategies

5. **LEARNING BOX METHODOLOGY**:
   - Clearly identify which principles are applied in each session
   - Explain the chosen learning sequence
   - Describe the adaptive features
   - Define the evaluation strategy

6. **RECOMMENDATIONS**:
   - Provide specific study tips
   - Suggest time management techniques
   - Recommend retention strategies
   - Explain the difficulty progression

The plan must be practical, personalized, and pedagogically sound, maximizing the student's retention and understanding.`
            }
          ]
        }
      ],
      model: 'googleai/gemini-2.5-flash-lite',
      output: {
        schema: GenerateKolearningPlanOutputSchema,
        format: 'json'
      },
      config: {
        temperature: 0.3,
        maxOutputTokens: 16384
      },
    });

    if (!response?.output) {
      throw new Error('Failed to generate Kolearning plan.');
    }

    return response.output;
  }
);

export async function generateKolearningPlan(input: GenerateKolearningPlanInput): Promise<GenerateKolearningPlanOutput> {
  return generateKolearningPlanFlow(input);
}