import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookUser, Tag, Users } from 'lucide-react';
import type { Deck } from '@/types';
import { Badge } from '../ui/badge';

export function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md hover:-translate-y-1">
      <CardHeader className='pb-4'>
        <CardTitle>{deck.title}</CardTitle>
        <CardDescription>{deck.description}</CardDescription>
      </CardHeader>
      <div className="px-6 pb-4 space-y-2 text-sm text-muted-foreground">
        <div className='flex items-center gap-2'>
            <BookUser className="h-4 w-4" />
            <span>{deck.author}</span>
        </div>
        <div className='flex items-center gap-2'>
            <Tag className="h-4 w-4" />
            <Badge variant="secondary">{deck.category}</Badge>
        </div>
      </div>
      <CardFooter className="mt-auto">
        <Link href={`/deck/${deck.id}`} className="w-full">
          <Button className="w-full">
            Start Learning ({deck.size} cards)
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
