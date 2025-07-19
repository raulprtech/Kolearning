
'use client';

import { useState, useMemo } from 'react';
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

// In a real app, this would be an API call. For now, we define the data here.
const allDecks: Deck[] = [
  {
    id: '1',
    title: 'Álgebra Básica',
    description: 'Aprende los fundamentos del álgebra.',
    category: 'Mathematics',
    author: 'Kolearning',
    size: 6,
    bibliography: ['"Algebra for Dummies" by Mary Jane Sterling'],
  },
  {
    id: '2',
    title: 'Capitales del Mundo',
    description: 'Pon a prueba tu conocimiento de las capitales del mundo.',
    category: 'Geography',
    author: 'Kolearning',
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
  {
    id: '4',
    title: 'Conceptos de Programación',
    description: 'Bases de la programación, algoritmos y estructuras de datos.',
    category: 'Programming',
    author: 'Kolearning',
    size: 15,
    bibliography: [],
  },
];

export default function ProyectosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [searchResults, setSearchResults] = useState<Deck[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const recommendedDecks = useMemo(() => allDecks.slice(0, 3), []);

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchTerms = normalizeText(searchQuery).split(/\s+/).filter(Boolean);

    let results = allDecks;

    // Filter by search query
    if (searchTerms.length > 0) {
      results = results.filter((deck) => {
        const deckText = normalizeText(
          `${deck.title} ${deck.description} ${deck.category}`
        );
        return searchTerms.every(term => deckText.includes(term));
      });
    }

    // Filter by author
    if (authorFilter) {
      results = results.filter(deck => deck.author === authorFilter);
    }

    setSearchResults(results);
    setIsSearching(true);
    setIsPopoverOpen(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explora Proyectos</h1>
        <p className="text-muted-foreground">
          Encuentra nuevos proyectos para ampliar tus conocimientos.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="w-full max-w-2xl h-14 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Search className="mr-4 h-5 w-5" />
                  <span className="font-semibold text-foreground">
                    {searchQuery || '¿Qué quieres aprender hoy?'}
                  </span>
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
            <form onSubmit={handleSearch} className="grid grid-cols-2 gap-6">
              <div className="grid gap-2 col-span-2">
                <label className="text-sm font-medium">Nombre del Proyecto</label>
                <Input
                  placeholder="e.g., Capitales del Mundo"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid gap-2 col-span-2">
                <label className="text-sm font-medium">Autor</label>
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar autor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Kolearning">Kolearning</SelectItem>
                    <SelectItem value="Community">Comunidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 mt-4 flex justify-end">
                <Button type="submit" className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Aplicar Búsqueda
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {isSearching && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Resultados de la búsqueda</h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((deck) => (
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
        </section>
      )}

      {!isSearching && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Recomendados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
