import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Code, Bot, LineChart, BookOpen } from 'lucide-react';
import type { Deck } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const categoryIcons: { [key: string]: React.ReactNode } = {
    Programming: <Code className="w-full h-full" />,
    'Web Development': <LineChart className="w-full h-full" />,
    AI: <Bot className="w-full h-full" />,
    Default: <BookOpen className="w-full h-full" />,
};

const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || categoryIcons.Default;
};

export function DashboardDeckCard({ deck }: { deck: Deck }) {
  const progress = Math.floor(Math.random() * 100); // Placeholder for actual progress

  return (
    <Card className="flex flex-col h-full transition-all duration-300 group bg-card/50 hover:bg-card hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1">
      <Link href={`/deck/${deck.id}/details`} className="block flex-grow">
        <CardContent className="p-6 flex-grow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 p-2.5 rounded-lg bg-primary/10 text-primary">
                    {getCategoryIcon(deck.category)}
                </div>
                <Badge variant="outline" className="font-normal capitalize">{deck.category}</Badge>
            </div>
            
            <h3 className="font-bold text-lg text-foreground mb-2 truncate">{deck.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10 flex-grow">{deck.description}</p>
        </CardContent>
      </Link>
      <div className="px-6 pb-4 pt-0">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <Button asChild variant="link" className="p-0 h-auto text-primary font-medium shrink-0">
            <Link href={`/deck/${deck.id}`}>
              <Play className="h-4 w-4 mr-2"/>
              <span>Empezar</span>
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
