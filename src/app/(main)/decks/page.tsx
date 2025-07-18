
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
        <h1 className="text-3xl font-bold">Explore Decks</h1>
        <p className="text-muted-foreground">
          Find new decks to expand your knowledge.
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
                   <span className="font-semibold text-foreground">Start searching...</span>
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
                <h4 className="font-medium leading-none">Advanced Search</h4>
                <p className="text-sm text-muted-foreground">
                    Fine-tune your search with the filters below.
                </p>
            </div>
            <Separator className="my-4" />
            <form className="grid grid-cols-2 gap-6">
                <div className="grid gap-2 col-span-2">
                    <label className="text-sm font-medium">Deck Name</label>
                    <Input placeholder="e.g., World Capitals" />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Topic</label>
                    <Input placeholder="e.g., Geography" />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Author</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Select author" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="kolearning">Kolearning Originals</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">School</label>
                    <Input placeholder="e.g., National University" />
                </div>
                 <div className="grid gap-2">
                    <label className="text-sm font-medium">Region</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="latam">Latin America</SelectItem>
                        <SelectItem value="na">North America</SelectItem>
                        <SelectItem value="eu">Europe</SelectItem>
                        <SelectItem value="asia">Asia</SelectItem>
                        <SelectItem value="africa">Africa</SelectItem>
                        <SelectItem value="oceania">Oceania</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2 mt-4 flex justify-end">
                     <Button className="w-full md:w-auto">
                        <Search className="mr-2 h-4 w-4" />
                        Apply Search
                    </Button>
                </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      <h2 className="text-2xl font-bold mb-4">Results</h2>

      {decks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No decks found</h2>
          <p className="text-muted-foreground mt-2">
            Try using different search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
