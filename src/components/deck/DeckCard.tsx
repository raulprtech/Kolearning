import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Deck } from '@/types';

export function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md hover:-translate-y-1">
      <CardHeader>
        <CardTitle>{deck.title}</CardTitle>
        <CardDescription>{deck.description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Link href={`/deck/${deck.id}`} className="w-full">
          <Button className="w-full">
            Start Learning
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
