


import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Timestamp;
  lastSessionAt: Timestamp;
  currentStreak: number;
  coins: number;
  energy: number;
  dominionPoints: number;
  rank: string;
  lastSessionCompletedAt?: string;
  weeklyActivity: boolean[];
}

export interface StudyPlan {
  plan: {
    topic: string;
    sessionType: string;
  }[];
  justification: string;
  expectedProgress: string;
  category?: string;
}

export interface ProjectDetails {
    title: string;
    description: string;
    category: string;
    isPublic: boolean;
    objective: string;
    timeLimit: string;
    masteryLevel: string;
    isCreating: boolean;
    cognitiveProfile?: string[];
    learningChallenge?: string;
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
  completedSessions?: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string; // Mapped from 'concepto'
  answer: string; // Mapped from 'descripcion'
  image?: string;
  // Atom-specific fields
  atomo_id: string;
  material_id: string;
  concepto: string;
  descripcion: string;
  atomos_padre: string[];
  formatos_presentacion: string[];
  dificultad_inicial: string;
}

export interface TutorSession {
  isActive: boolean;
  exchangesLeft: number;
}

export interface SessionPerformanceSummary {
    totalCards: number;
    correctCards: number;
    incorrectCards: number;
    difficultCards: {
        question: string;
        attempts: number;
        timesAskedForHelp: number;
    }[];
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

const KnowledgeAtomSchema = z.object({
  atomo_id: z.string().describe("A unique ID for the atom within this material (e.g., 'ALG023')."),
  material_id: z.string().describe("The ID for the entire deck (e.g., 'MAT001')."),
  concepto: z.string().describe('The core concept, term, or question (the "front" of the flashcard).'),
  descripcion: z.string().describe('The definition, explanation, or answer (the "back" of the flashcard). Supports Markdown and LaTeX.'),
  atomos_padre: z.array(z.string()).describe("An array of 'atomo_id's that are prerequisites for this atom. Empty if none."),
  formatos_presentacion: z.array(z.string()).describe("Suitable learning formats (e.g., 'Identificación', 'Ejemplificación')."),
  dificultad_inicial: z.string().describe("Initial difficulty level (e.g., 'Fundamental', 'Intermedio', 'Avanzado')."),
});

export const GenerateDeckFromTextOutputSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated flashcard deck.'),
  description: z.string().describe('A brief, one-sentence description of the flashcard deck.'),
  material_id: z.string().describe("A unique ID for this entire deck (e.g., 'MAT001')."),
  flashcards: z.array(KnowledgeAtomSchema)
    .describe('An array of all relevant knowledge atoms (flashcards) based on the key concepts in the notes. Do not limit the number of cards.'),
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
  atomo_id: z.string(),
  concepto: z.string(),
  descripcion: z.string(),
  atomos_padre: z.array(z.string()),
  dificultad_inicial: z.string(),
});

export const GenerateStudyPlanInputSchema = z.object({
  projectTitle: z.string().describe('The title of the study project.'),
  objective: z.string().describe('The user\'s learning goal (e.g., "pass an exam", "review for an interview").'),
  timeLimit: z.string().describe('The time frame the user has to study (e.g., "2 weeks", "1 month").'),
  masteryLevel: z.string().describe('The user\'s self-assessed mastery level (e.g., "Beginner", "Intermediate").'),
  flashcards: z.array(StudyPlanFlashcardSchema).describe('The list of knowledge atoms (flashcards) for the project.'),
  cognitiveProfile: z.array(z.string()).optional().describe("User's preferred learning styles (e.g., 'Visual', 'Practical Examples')."),
  learningChallenge: z.string().optional().describe("User's biggest self-reported learning challenge."),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

export const GenerateStudyPlanOutputSchema = z.object({
  plan: z.array(z.object({
    topic: z.string().describe('The specific topic or concept to be covered in this session.'),
    sessionType: z.string().describe("The recommended session type (e.g., 'Calibración Inicial', 'Refuerzo de Dominio', 'Consulta con Koli')."),
  })).describe('A structured array representing the study plan.'),
  justification: z.string().describe('A brief, encouraging explanation of why the plan is structured this way.'),
  expectedProgress: z.string().describe("A brief explanation of the expected progress after each major section or day of the plan."),
  category: z.string().describe('A relevant, single-word category for the project in Spanish (e.g., "Programación", "Biología", "Historia").'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;
