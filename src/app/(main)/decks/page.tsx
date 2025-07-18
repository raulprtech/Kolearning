import { DeckCard } from '@/components/deck/DeckCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuthSession } from '@/lib/auth';
import type { Deck } from '@/types';
import { Search } from 'lucide-react';

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

export default async function DecksPage() {
  const decks = await getDecks();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explorar Decks</h1>
        <p className="text-muted-foreground">
          Encuentra nuevos mazos para ampliar tu conocimiento.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Búsqueda Avanzada</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Deck</Label>
              <Input id="name" placeholder="Ej: Capitales del Mundo" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author">Autor</Label>
              <Select>
                <SelectTrigger id="author">
                  <SelectValue placeholder="Seleccionar autor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kolearning">
                    Originals de Kolearning
                  </SelectItem>
                  <SelectItem value="community">Comunidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic">Tema</Label>
              <Input id="topic" placeholder="Ej: Geografía" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">Escuela</Label>
              <Input id="school" placeholder="Ej: Universidad Nacional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="region">Región</Label>
               <Select>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Seleccionar región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latam">Latinoamérica</SelectItem>
                  <SelectItem value="na">Norteamérica</SelectItem>
                  <SelectItem value="eu">Europa</SelectItem>
                  <SelectItem value="asia">Asia</SelectItem>
                  <SelectItem value="africa">África</SelectItem>
                  <SelectItem value="oceania">Oceanía</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2 self-end">
                <Button className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Resultados</h2>

      {decks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No se encontraron decks</h2>
          <p className="text-muted-foreground mt-2">
            Intenta con otros criterios de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
