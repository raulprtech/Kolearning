import { getAuthSession } from '@/lib/auth';
import type { Deck, User } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Smartphone, Flame, TrendingUp, Play, Bot } from 'lucide-react';

async function getUserData(uid: string): Promise<User | null> {
    const mockTimestamp = {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;

    return {
        uid: 'mock-user-id',
        email: 'test@example.com',
        createdAt: mockTimestamp,
        lastSessionAt: mockTimestamp,
        currentStreak: 3,
    };
}

async function getDecks(): Promise<Deck[]> {
  // Return mock data
  return [
    {
      id: '1',
      title: 'Basic Algebra',
      description: 'Learn the fundamentals of algebra.',
      category: 'Mathematics',
      author: 'Kolearning Originals',
      size: 6,
      bibliography: ['"Algebra for Dummies" by Mary Jane Sterling'],
    },
    {
      id: '2',
      title: 'World Capitals',
      description: 'Test your knowledge of world capitals.',
      category: 'Geography',
      author: 'Kolearning Originals',
      size: 5,
      bibliography: ['National Geographic Atlas of the World'],
    },
    {
      id: '3',
      title: 'Spanish Vocabulary',
      description: 'Expand your Spanish vocabulary.',
      category: 'Languages',
      author: 'Community',
      size: 7,
      bibliography: ['"Madrigal\'s Magic Key to Spanish" by Margarita Madrigal'],
    },
  ];
}


export default async function DashboardPage() {
    const session = await getAuthSession();
    const user = session ? await getUserData(session.uid) : null;
    const decks = await getDecks();
    const availableDecks = decks.length;
    const currentStreak = user?.currentStreak ?? 0;

  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">¡Bienvenido de nuevo!</h1>
          <p className="text-muted-foreground mt-2">¿Listo para continuar tu viaje de aprendizaje?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-muted-foreground text-sm">Mazos Disponibles</p>
                <p className="text-2xl font-bold">{availableDecks}</p>
              </div>
            </CardContent>
          </Card>
           <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <Flame className="h-8 w-8 text-primary" />
              <div>
                <p className="text-muted-foreground text-sm">Racha Actual</p>
                <p className="text-2xl font-bold">{currentStreak}</p>
              </div>
            </CardContent>
          </Card>
           <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-muted-foreground text-sm">Progreso de Aprendizaje</p>
                <p className="text-2xl font-bold">Activo</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-primary/80 hover:bg-primary text-primary-foreground w-full sm:w-auto">
                <Play className="mr-2 h-5 w-5" />
                Sesión de Estudio Rápida
            </Button>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <Link href="/tutor">
                    <Bot className="mr-2 h-5 w-5" />
                    Preguntar al Tutor IA
                </Link>
            </Button>
        </div>

      </div>
    </div>
  );
}