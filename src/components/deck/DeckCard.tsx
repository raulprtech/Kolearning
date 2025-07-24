// import { Timestamp } from 'firebase/firestore';

// export interface User {
//   uid: string;
//   email: string;
//   createdAt: Timestamp;
//   lastSessionAt: Timestamp;
//   currentStreak: number;
//   coins: number;
//   energy: number;
// }

// export interface Project {
//   id: string;
//   title: string;
//   description: string;
//   category: string;
//   author: string;
//   school?: string;
//   size: number;
//   bibliography: string[];
// }

// export interface Flashcard {
//   id: string;
//   deckId: string;
//   question: string;
//   answer: string;
// }

// export interface TutorSession {
//   isActive: boolean;
//   exchangesLeft: number;
// }


import { Card, CardContent } from '@/components/ui/card';

interface DeckCardProps {
  title: string;
  description: string;
}

export function DeckCard({ title, description }: DeckCardProps) {
  return (
    <Card>
      <CardContent>
        <h3 className="font-bold">{title}</h3>
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}