import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  createdAt: Timestamp;
  lastSessionAt: Timestamp;
  currentStreak: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  size: number;
  bibliography: string[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}
