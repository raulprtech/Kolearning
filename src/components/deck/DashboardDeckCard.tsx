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


import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import type { Project } from '@/types';

export function DashboardDeckCard({ project }: { project: Project }) {
  const startSessionUrl = `/aprender?project=${project.slug}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{project.description}</p>
        <Button asChild>
          <Link href={startSessionUrl}>
            <Play className="mr-2 h-4 w-4" />
            Empezar a estudiar
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}