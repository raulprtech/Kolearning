'use server';

/**
 * @fileOverview Generates a dynamic learning plan from a list of flashcards.
 *
 * - generateLearningPlan - A function that creates a pedagogical learning plan.
 * - GenerateLearningPlanInput - The input type for the function.
 * - GenerateLearningPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FlashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const GenerateLearningPlanInputSchema = z.object({
  title: z.string().describe('The title of the project or deck.'),
  flashcards: z
    .array(FlashcardSchema)
    .describe('The list of question/answer pairs to build the plan from.'),
});
type GenerateLearningPlanInput = z.infer<typeof GenerateLearningPlanInputSchema>;

const MultipleChoiceQuestionSchema = z.object({
  type: z.literal('multiple-choice'),
  question: z.string(),
  code: z.string().optional(),
  options: z.array(z.object({ id: z.string(), text: z.string() })).length(4),
  correctAnswer: z.string(),
  correctAnswerText: z.string(),
});

const OpenAnswerQuestionSchema = z.object({
  type: z.literal('open-answer'),
  question: z.string(),
  correctAnswerText: z.string(),
});

const MatchingQuestionSchema = z.object({
  type: z.literal('matching'),
  question: z.string(),
  pairs: z.array(z.object({ id: z.string(), term: z.string(), definition: z.string() })),
  correctAnswerText: z.string(),
});

const OrderingQuestionSchema = z.object({
  type: z.literal('ordering'),
  question: z.string(),
  items: z.array(z.object({ id: z.string(), text: z.string() })),
  correctAnswerText: z.string(),
});

const FillInTheBlankQuestionSchema = z.object({
  type: z.literal('fill-in-the-blank'),
  question: z.string(),
  textParts: z.array(z.string()),
  correctAnswer: z.string(),
  correctAnswerText: z.string(),
});

const AnyQuestionSchema = z.union([
    MultipleChoiceQuestionSchema,
    OpenAnswerQuestionSchema,
    MatchingQuestionSchema,
    OrderingQuestionSchema,
    FillInTheBlankQuestionSchema
]);

const GenerateLearningPlanOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(AnyQuestionSchema),
  category: z.string().describe("A suitable category for this learning plan based on its content (e.g., 'Programming', 'Science', 'History')."),
  bibliography: z.array(z.string()).optional().describe("If applicable, suggest one or two book or source recommendations related to the topic.")
});
type GenerateLearningPlanOutput = z.infer<typeof GenerateLearningPlanOutputSchema>;


export async function generateLearningPlan(
  input: GenerateLearningPlanInput
): Promise<GenerateLearningPlanOutput> {
  return generateLearningPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningPlanPrompt',
  input: { schema: GenerateLearningPlanInputSchema },
  output: { schema: GenerateLearningPlanOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert instructional designer. Your task is to create a dynamic and effective learning plan from a given list of flashcards (term/definition pairs).

Based on the provided flashcards for the topic "{{title}}", you will generate a new set of questions. Your goal is to create a pedagogically sound mix of question formats to enhance learning and retention.

The available question formats you can generate are:
- 'open-answer': Good for testing deeper understanding and explanation.
- 'matching': Good for associating terms with definitions.
- 'ordering': Good for procedural knowledge or timelines.
- 'fill-in-the-blank': Good for memorizing key terms within a context.
- 'multiple-choice': Good for recall and recognition. You can convert a flashcard pair into a multiple-choice question.

Analyze the provided flashcards and decide the best format for each concept. You should use a variety of these formats. Not every flashcard needs to become a question, and some flashcards can be used to create more complex questions (like matching or ordering).

From the provided flashcards, you must generate:
1. A suitable, engaging description for the learning plan.
2. A list of questions using the different formats available.
3. A relevant category for the topic.
4. (Optional) One or two bibliography recommendations if the topic is well-known.

Flashcards provided:
{{#each flashcards}}
- Term: {{question}}
- Definition: {{answer}}
{{/each}}

Your output MUST be a JSON object that follows this schema, paying close attention to the structure required by each question type.
\`\`\`json
${JSON.stringify(GenerateLearningPlanOutputSchema.shape, null, 2)}
\`\`\`
`,
});

const generateLearningPlanFlow = ai.defineFlow(
  {
    name: 'generateLearningPlanFlow',
    inputSchema: GenerateLearningPlanInputSchema,
    outputSchema: GenerateLearningPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
