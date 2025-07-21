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

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  school?: string;
  size: number;
  bibliography: string[];
  flashcards?: Flashcard[];
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
}

export interface TutorSession {
  isActive: boolean;
  exchangesLeft: number;
}
