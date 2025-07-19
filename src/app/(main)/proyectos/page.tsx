
import { DeckCard } from '@/components/deck/DeckCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import type { Deck } from '@/types';
import { Search, SlidersHorizontal } from 'lucide-react';

async function getDecks(): Promise<Deck[]> {
  // Return mock data
  return [
    {
      id: '1',
      title: 'Álgebra Básica',
      description: 'Aprende los fundamentos del álgebra.',
      category: 'Mathematics',
      author: 'Kolearning Originals',
      size: 6,
      bibliography: ['"Algebra for Dummies" by Mary Jane Sterling'],
    },
    {
      id: '2',
      title: 'Capitales del Mundo',
      description: 'Pon a prueba tu conocimiento de las capitales del mundo.',
      category: 'Geography',
      author: 'Kolearning Originals',
      size: 5,
      bibliography: ['National Geographic Atlas of the World'],
    },
    {
      id: '3',
      title: 'Vocabulario de Español',
      description: 'Amplía tu vocabulario en español.',
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
        <h1 className="text-3xl font-bold">Explora Proyectos</h1>
        <p className="text-muted-foreground">
          Encuentra nuevos proyectos para ampliar tus conocimientos.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="w-full max-w-2xl h-14 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                   <Search className="mr-4 h-5 w-5" />
                   <span className="font-semibold text-foreground">Empieza a buscar...</span>
                </div>
                <div className="flex items-center">
                   <Separator orientation="vertical" className="h-8 mx-4" />
                   <SlidersHorizontal className="h-5 w-5" />
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-6">
             <div className="grid gap-4">
                <h4 className="font-medium leading-none">Búsqueda Avanzada</h4>
                <p className="text-sm text-muted-foreground">
                    Ajusta tu búsqueda con los filtros a continuación.
                </p>
            </div>
            <Separator className="my-4" />
            <form className="grid grid-cols-2 gap-6">
                <div className="grid gap-2 col-span-2">
                    <label className="text-sm font-medium">Nombre del Proyecto</label>
                    <Input placeholder="e.g., Capitales del Mundo" />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Tema</label>
                    <Input placeholder="e.g., Geografía" />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Autor</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Seleccionar autor" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="kolearning">Kolearning Originals</SelectItem>
                        <SelectItem value="community">Comunidad</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Escuela</label>
                    <Input placeholder="e.g., Universidad Nacional" />
                </div>
                 <div className="grid gap-2">
                    <label className="text-sm font-medium">Región</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Seleccionar región" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="latam">América Latina</SelectItem>
                        <SelectItem value="na">América del Norte</SelectItem>
                        <SelectItem value="eu">Europa</SelectItem>
                        <SelectItem value="asia">Asia</SelectItem>
                        <SelectItem value="africa">África</SelectItem>
                        <SelectItem value="oceania">Oceanía</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2 mt-4 flex justify-end">
                     <Button className="w-full md:w-auto">
                        <Search className="mr-2 h-4 w-4" />
                        Aplicar Búsqueda
                    </Button>
                </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      <h2 className="text-2xl font-bold mb-4">Resultados</h2>

      {decks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No se encontraron proyectos</h2>
          <p className="text-muted-foreground mt-2">
            Intenta usar diferentes criterios de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
