
import { getAuthSession } from '@/lib/auth';
import type { User } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, Play, Bot, PlusCircle, BookCopy, Search, Flame, TrendingUp } from 'lucide-react';
import type { Deck } from '@/types';
import { DashboardDeckCard } from '@/components/deck/DashboardDeckCard';

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
        coins: 142,
        energy: 5,
    };
}

async function getMyDecks(): Promise<Deck[]> {
  // Return mock data for the user's decks
  return [
    {
      id: '1',
      title: 'JavaScript Fundamentals',
      description: 'Master the basics of JavaScript programming with essential concepts and syntax.',
      category: 'Programming',
      author: 'User',
      size: 20,
      bibliography: [],
    },
    {
      id: '2',
      title: 'React Essentials',
      description: 'Learn the core concepts of React including components, props, state, and hooks.',
      category: 'Programming',
      author: 'User',
      size: 25,
      bibliography: [],
    },
    {
      id: '3',
      title: 'Web Development Basics',
      description: 'Fundamental concepts every web developer should know about HTML, CSS, and web technologies.',
      category: 'Web Development',
      author: 'User',
      size: 30,
      bibliography: [],
    },
     {
      id: 'gen-12345',
      title: 'Plan de Estudio: Estado del Arte en IA para Segmentación de Tumores Renales',
      description: 'Plan de estudio para comprender el estado del arte en el uso de la Inteligencia Artificial para la segmentación de tumores renales, incluyendo aspectos multimodales, optimización y despliegue en hardware.',
      category: 'AI',
      author: 'AI',
      size: 15,
      bibliography: [],
    },
  ];
}


export default async function DashboardPage() {
    const session = await getAuthSession();
    const user = session ? await getUserData(session.uid) : null;
    const myDecks = await getMyDecks();
    const availableDecks = myDecks.length;
    const currentStreak = user?.currentStreak ?? 0;

  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">¡Bienvenido de nuevo!</h1>
          <p className="text-muted-foreground mt-2">¿Qué aprenderás hoy?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-muted-foreground text-sm">Progreso de Aprendizaje</p>
                <p className="text-2xl font-bold">Activo</p>
              </div>
            </CardContent>
          </Card>
           <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-muted-foreground text-sm">Energía Restante</p>
                <p className="text-2xl font-bold">{currentStreak}</p>
              </div>
            </CardContent>
          </Card>
           <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4">
                <div className="flex items-center gap-2 text-orange-500">
                    <Flame className="h-6 w-6" />
                    <p className="text-muted-foreground text-sm">Racha Actual</p>
                </div>
                <p className="text-4xl font-bold">{currentStreak}</p>
                <Button size="sm" className="w-full bg-primary/80 hover:bg-primary text-primary-foreground">
                    <Play className="mr-2 h-4 w-4" />
                    Sesión de Estudio
                </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Mis Planes de Estudio</h2>
                <div className="flex gap-4">
                    <Button asChild variant="secondary">
                        <Link href="/proyectos">
                            <Search className="mr-2 h-5 w-5" />
                            Buscar proyecto
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/create">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Nuevo proyecto
                        </Link>
                    </Button>
                </div>
            </div>
             {myDecks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {myDecks.map((deck) => (
                        <DashboardDeckCard key={deck.id} deck={deck} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No tienes mazos todavía</h2>
                    <p className="text-muted-foreground mt-2">
                        Usa la importación mágica para crear tu primer mazo.
                    </p>
                </div>
            )}
        </div>


        <div className="flex flex-col sm:flex-row gap-4">
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
