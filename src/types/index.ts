
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  createdAt: Timestamp;
  lastSessionAt: Timestamp;
  currentStreak: number;
  coins: number;
  energy: number;
}

export interface StudyPlan {
  plan: {
    section: string;
    topic: string;
    sessionType: string;
  }[];
  justification: string;
}

export interface ProjectDetails {
    title: string;
    description: string;
    category: string;
    isPublic: boolean;
    isCreating: boolean;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  school?: string;
  size: number;
  bibliography: string[];
  isPublic: boolean;
  flashcards?: Flashcard[];
  studyPlan?: StudyPlan;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  image?: string;
}

export interface TutorSession {
  isActive: boolean;
  exchangesLeft: number;
}


// AI Flow Schemas and Types

// evaluate-open-answer
export const EvaluateOpenAnswerInputSchema = z.object({
  question: z.string().describe('The original question that was asked.'),
  correctAnswer: z.string().describe('The ground truth correct answer to the question.'),
  userAnswer: z.string().describe("The user's submitted answer."),
});
export type EvaluateOpenAnswerInput = z.infer<typeof EvaluateOpenAnswerInputSchema>;

export const EvaluateOpenAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer is considered correct."),
  feedback: z
    .string()
    .describe(
      "Personalized feedback based on the user's answer. If correct, provide a short, encouraging message. If incorrect, explain the main error or acknowledge partial correctness (e.g., 'You're on the right track, but...'). Never give him the answer, just clues for him to discover alone."
    ),
  rephrasedQuestion: z
    .string()
    .optional()
    .describe(
      "A rephrased version of the original question to guide the user. This should only be provided if the user's answer is incorrect."
    ),
});
export type EvaluateOpenAnswerOutput = z.infer<typeof EvaluateOpenAnswerOutputSchema>;


// generate-deck-from-text
export const GenerateDeckFromTextInputSchema = z.object({
  studyNotes: z.union([z.string(), z.array(z.string())])
    .describe(
      'The study notes to generate a flashcard deck from. Can be plain text, Markdown, LaTeX, a Data URI for a PDF, HTML content, or an array of Data URIs for images.'
    ),
});
export type GenerateDeckFromTextInput = z.infer<typeof GenerateDeckFromTextInputSchema>;

export const GenerateDeckFromTextOutputSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated flashcard deck.'),
  description: z.string().describe('A brief, one-sentence description of the flashcard deck.'),
  flashcards: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            'The flashcard question (supports Markdown and LaTeX). Should be a clear, answerable question based on the notes.'
          ),
        answer: z
          .string()
          .describe(
            'The flashcard answer (supports Markdown and LaTeX). Should be a concise and accurate answer to the question.'
          ),
      })
    )
    .min(5)
    .max(15)
    .describe('An array of 5 to 15 flashcards based on the key concepts in the notes.'),
});
export type GenerateDeckFromTextOutput = z.infer<typeof GenerateDeckFromTextOutputSchema>;


// generate-options-for-question
export const GenerateOptionsForQuestionInputSchema = z.object({
  question: z.string().describe('The question for which to generate options.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});
export type GenerateOptionsForQuestionInput = z.infer<typeof GenerateOptionsForQuestionInputSchema>;

export const GenerateOptionsForQuestionOutputSchema = z.object({
  options: z
    .array(z.string())
    .length(4)
    .describe(
      'An array of four strings. One string must be the `correctAnswer`. The other three must be plausible but incorrect distractors. The order of the options should be random.'
    ),
});
export type GenerateOptionsForQuestionOutput = z.infer<typeof GenerateOptionsForQuestionOutputSchema>;


// refine-project-details
const RefineFlashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const RefineProjectDetailsInputSchema = z.object({
  currentTitle: z.string().optional().describe('The user\'s current title for the project.'),
  currentDescription: z.string().optional().describe('The user\'s current description.'),
  flashcards: z.array(RefineFlashcardSchema).describe('The list of flashcards to analyze.'),
});
export type RefineProjectDetailsInput = z.infer<typeof RefineProjectDetailsInputSchema>;

export const RefineProjectDetailsOutputSchema = z.object({
  title: z.string().describe('A concise, descriptive, and engaging title for the project in Spanish.'),
  description: z.string().describe('A one or two-sentence summary of the project in Spanish.'),
  category: z.string().describe('A relevant, single-word category for the project in Spanish (e.g., "Programación", "Biología", "Historia").'),
});
export type RefineProjectDetailsOutput = z.infer<typeof RefineProjectDetailsOutputSchema>;


// generate-study-plan
const StudyPlanFlashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const GenerateStudyPlanInputSchema = z.object({
  projectTitle: z.string().describe('The title of the study project.'),
  objective: z.string().describe('The user\'s learning goal (e.g., "pass an exam", "review for an interview").'),
  flashcards: z.array(StudyPlanFlashcardSchema).describe('The list of knowledge atoms (flashcards) for the project.'),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

export const GenerateStudyPlanOutputSchema = z.object({
  plan: z.array(z.object({
    section: z.string().describe("The section or day of the plan (e.g., 'Día 1', 'Semana 2', 'Conceptos Fundamentales')."),
    topic: z.string().describe('The specific topic or concept to be covered in this session.'),
    sessionType: z.string().describe("The recommended session type ('Opción Múltiple', 'Respuesta Abierta', 'Tutor AI', 'Quiz de Repaso')."),
  })).describe('A structured array representing the study plan, with 5 to 10 sessions.'),
  justification: z.string().describe('A brief, encouraging explanation of why the plan is structured this way to help the user achieve their goal.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;
